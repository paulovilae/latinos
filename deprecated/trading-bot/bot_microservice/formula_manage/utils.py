import json
import os
import pandas as pd  
from cryptography.fernet import Fernet

def sort_formulas(df:pd.DataFrame,period:str):
    test_df =df[df[8].apply(lambda x: x.get('period') == period)]
    test_df = split_by_username(test_df)
    return test_df
    
def split_by_username(df):
    # Group the DataFrame by column 1 (which is the username)
    grouped = df.groupby(df[1])
    
    # Create a list of DataFrames, each containing records for a specific username
    df_list = [group for _, group in grouped]
    
    return df_list

def create_user_dictionary(user_list:list):
       
       user_dict = {}
       for user in user_list:
          username, tv_user, tv_pass = user
          user_dict[username] = {'username': username, 'tv_user':tv_user, 'tv_pass':tv_pass}

       return user_dict

def decrypt_data(encrypted_data:str):
     encryption_key = os.environ.get("ENCRYPTION_KEY")
     cipher_suite = Fernet(encryption_key)
     decrypted_data = cipher_suite.decrypt(encrypted_data)

     return decrypt_data

