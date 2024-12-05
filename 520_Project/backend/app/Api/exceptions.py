class InvalidInputException(Exception):
    def __init__(self, message="Invalid Input"):
        super().__init__(message)

class UserAlreadyExistsException(Exception):
    def __init__(self, username=""):
        message = f"{username} already exists! Please login instead!!"
        super().__init__(message)

class InvalidInputQueryException(Exception):
    def __init__(self):
        message = "Potentially dangerous operations detected, so not executing the code!!"
        super().__init__(message)

class InvalidFileTypeException(Exception):
    def __init__(self, filename):
        message = f"Currently, we only process csv files. {filename} is not a csv file!!"
        super().__init__(message)