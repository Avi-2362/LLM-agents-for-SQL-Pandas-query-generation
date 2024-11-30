import pytest
import os, sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../app/Api')))
from models import *

# test the User model
def test_user_model():
    user = User(user_id='123', name='John Doe', username='johndoe', email='john.doe@example.com')
    user.put()  # Insert into USER_TABLE
    assert User.get('123') == {'user_id': '123', 'name': 'John Doe', 'username': 'johndoe', 'email': 'john.doe@example.com'}
    assert user.to_json() == '{"user_id": "123", "name": "John Doe", "username": "johndoe", "email": "john.doe@example.com"}'

# test the UserFiles model
def test_user_files_model():
    user_files = UserFiles(user_id='123', file_ids=['file1', 'file2'])
    user_files.put()  # Insert into USER_FILES_TABLE
    print(UserFiles.get('123'))
    assert UserFiles.get('123') == {'user_id': '123', 'file_ids': ['file1', 'file2']}
    assert user_files.to_json() == '{"user_id": "123", "file_ids": ["file1", "file2"]}'
