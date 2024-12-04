import pandas as pd
import uuid
from datetime import datetime
from flask import Blueprint, Flask, jsonify, request, redirect
from flask_classful import FlaskView, route
# from flask_cors import cross_origin
# from flask import make_response, request, current_app
# from datetime import timedelta, datetime
# from functools import update_wrapper
from models import *
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
)
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
from llm_agent import process_pandas_result_to_json, query_pandas_agent, query_sql_agent
from app.Api.models import *
from app.Api.exceptions import *
from app.Api.enums import *

allowed_hosts=["http://localhost:4200/*","http://localhost:4200"]

class UserResource(FlaskView):
    route_base = '/api/user/'
    # route_base = '/'

    @route('all/files', methods=['GET','POST'])
    @jwt_required()
    def get_user_files(self):
        print(request)
        user_id = get_jwt_identity()
        user = User.get(user_id) # TODO: need to get from jwt_identity
        print(user['user_id'])
        return jsonify(UserFiles.get(user['user_id']))
    
    @route('upload/file', methods=['POST'])
    @jwt_required()
    def upload_file(self):
        '''
        ## This function should be called after generate-upload-url from frontend
        request body:
        {
            'user_id': <user_id>,
            'file': {
                'filename': <filename>,
                'file_id': <file_id>,
                'size': <file-size-kb>
            }
        }
        '''
        # user_id = request.json.get('user_id') # TODO: need to get from jwt_identity
        user_id = get_jwt_identity()
        userFiles = UserFiles.get(user_id)
        print("user files")
        print(userFiles)
        # current file
        filename = request.json.get('filename')
        file_id = request.json.get('file_id')
        date = str(datetime.utcnow())
        print(request.json)
        print(f"filename: {filename}")
        userFiles['files'].append({
            "filename": filename,
            "file_id": file_id,
            "date": date
        })
        userFiles = UserFiles.from_dict(userFiles)
        print(userFiles)
        userFiles.put() # put in user-files
        print(userFiles.to_json())
        return jsonify(userFiles.to_json())
    
    @route('generate-upload-url', methods=['GET'])
    def generate_upload_url(self):
        # print(request.args)
        file_id = str(uuid.uuid4())
        try:
            filename = request.args.get('filename')
            params = {
                'Bucket': S3_BUCKET_NAME,
                'Key': file_id,
                'ContentType': 'text/csv'
            }
            url = s3_client.generate_presigned_url('put_object', Params=params, ExpiresIn=600)
            return jsonify({
                'url': url,
                'file_id': file_id
                })
        except (NoCredentialsError, PartialCredentialsError) as e:
            print(e)
            return jsonify({'error': 'Credentials error'}), 500
        except Exception as e:
            print(e)
            return jsonify({'error': 'Error generating upload URL'}), 500

    # @route('view/file-url', methods=['GET'])
    @route('generate-view-url', methods=['GET'])
    def generate_view_url(self):
        try:
            file_id = request.args.get('file_id')
            params = {
                'Bucket': S3_BUCKET_NAME,
                'Key': file_id
            }
            url = s3_client.generate_presigned_url('get_object', Params=params, ExpiresIn=600)
            print(url)
            return jsonify({'url': url})
        except (NoCredentialsError, PartialCredentialsError) as e:
            print(e)
            return jsonify({'error': 'Credentials error'}), 500
        except Exception as e:
            print("*"*100)
            print(e)
            return jsonify({'error': 'Error generating download URL'}), 500

    
    @route('delete/file')
    def delete_file(self):
        return jsonify({

        })
    
class AuthResource(FlaskView):
    route_base = '/'

    @route('hello', methods=['GET', 'POST', 'OPTIONS'])
    def health_check(self):
        return jsonify({'hello': "hello"})
    
    @route('new_user', methods=['POST'])
    def add_new_user(self):
        '''
        Register a new user
        '''
        username = request.json.get('username')
        name = request.json.get('name')
        email = request.json.get('email')
        hashed_password = request.json.get('hashed_password')
        data = {
            "username": username,
            "name": name,
            "email": email,
            "hashed_password": hashed_password
        }
        print(request.json)
        print(data)
        try:
            # data = request.json # data.keys = ('username', 'name', 'email')
            # check if the user already exists
            print(f"{data['username']}")
            user = User.get(data['username'])
            print(user)
            if user is not None:
                user = User.from_dict(user)
                raise UserAlreadyExistsException(user.username)
            
            user, status = User.validate_nd_make_user(data)
            if status==Status.VALID:
                # 1. Add the user in user table
                user.put()
                print("put the user!!")
                # 2. Add in user files table
                usr_files = UserFiles(user.user_id, files=[])
                usr_files.put()

            return jsonify({
                "msg": "New user added successfully!!"
            })
        except InvalidInputException as e:
            print(f"error-1 : {e}")
            return jsonify({
                "msg": str(e)
            }),404
        except UserAlreadyExistsException as e:
            print(f"error-2: {e}")
            return jsonify({
                "msg": str(e)
            }),404
        except Exception as e:
            print(f"error-3: {e.with_traceback()}")
            return jsonify({
                "msg": f"{e}"
            }),404
        
    
    @route('login', methods=['POST'])
    def login(self):
        user_id = request.json.get('user_id')
        password = request.json.get('hashed_password')
        try: 
            resp = User.get(user_id)
            print(resp)
            if resp is not None and resp['hashed_password']==password:
                access_token = create_access_token(identity=user_id)
                print(access_token)
                response = jsonify({"msg": "Login successful"})
                set_access_cookies(response, access_token)  # Set JWT token as a cookie
                return response, 200
            else:
                return jsonify({"msg": "Bad username or password"}), 401
        except Exception as e:
            print("error....",e)
            return jsonify({"msg": "Bad username or password"}), 401
    
    @route('auth_check', methods=['GET'])
    @jwt_required()
    def auth_check(self):
        current_user = get_jwt_identity()
        return jsonify(logged_in=True, user_id=current_user), 200

    @route("/logout", methods=["POST"])
    @jwt_required()
    def logout(self):
        response = jsonify({"msg": "Logout successful"})
        unset_jwt_cookies(response)  # Clear JWT cookies
        return response, 200
    
# This contains the business logic apis
class ApiResource(FlaskView):
    route_base = '/'

    @route('get-pandas-query', methods=['POST'])
    @jwt_required()
    def get_pandas_query(self):
        user_id=get_jwt_identity()
        print(user_id)
        # Get CSV file key and user query from the request
        data = request.json
        file_key = data.get('file_key')
        user_query = data.get('query')

        if not file_key or not user_query:
            return jsonify({'error': 'file_key and query are required'}), 400

        # Get the file from S3
        params = {
                'Bucket': S3_BUCKET_NAME,
                'Key': file_key
            }
        url = s3_client.generate_presigned_url('get_object', Params=params, ExpiresIn=600)
        print(f'url: {url}')
        df = pd.read_csv(url)
        res = query_pandas_agent(df,user_query)
        llm_output = process_pandas_result_to_json(res)

        # Return the response back to the frontend
        return jsonify(llm_output), 200
    
    @route('get-sql-query', methods=['POST'])
    @jwt_required()
    def get_sql_query(self):
        user_id=get_jwt_identity()
        print(user_id)
        # Get CSV file key and user query from the request
        data = request.json
        file_key = data.get('file_key')
        user_query = data.get('query')

        if not file_key or not user_query:
            return jsonify({'error': 'file_key and query are required'}), 400

        # Get the file from S3
        params = {
                'Bucket': S3_BUCKET_NAME,
                'Key': file_key
            }
        url = s3_client.generate_presigned_url('get_object', Params=params, ExpiresIn=600)
        print(f'url: {url}')
        df = pd.read_csv(url)
        llm_output = query_sql_agent(df,user_query)

        # Return the response back to the frontend
        return jsonify(llm_output), 200