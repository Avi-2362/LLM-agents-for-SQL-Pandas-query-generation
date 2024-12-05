import json
import pytest
import os, sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../app/Api')))
from llm_agent import *
import pandas as pd

# creates an sqlite database from a simple pandas dataframe and checks if the data is correct
def test_csv_to_sqlite():
    df = pd.DataFrame({'A': [1, 2], 'B': [3, 4]})
    db_file = "temp_table.db"
    table_name = "temp_table"
    csv_to_sqlite(df, db_file, table_name)
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    c.execute(f"SELECT * FROM {table_name}")
    rows = c.fetchall()
    assert rows == [(1, 3), (2, 4)]
    conn.close()
    os.remove(db_file)

# tabular query: agent should return filtered rows where age is 21. verify the passenger ids using ground truth data
def test_query_sql_agent1():
    df = pd.read_csv("https://raw.githubusercontent.com/pandas-dev/pandas/main/doc/data/titanic.csv")
    query = "filter rows where age is 21"
    try:
        sql_data = query_sql_agent(df, query)
        passengers = json.loads(sql_data['result'])['PassengerId'].values()
        gt = open('passengers.txt', 'r+')
        gt = gt.read().split(',')
        gt = [int(i) for i in gt]
        assert set(passengers) == set(gt)
    except Exception as e:
        assert False, f"Error: {e}"

# numerical query: agent should return correct number for the query "how many people with age = 21?"
def test_query_sql_agent2():
    df = pd.read_csv("https://raw.githubusercontent.com/pandas-dev/pandas/main/doc/data/titanic.csv")
    query = "how many people with age = 21?"
    sql_data = query_sql_agent(df, query)
    assert int(sql_data['result']) == 24

# this should return an exception because the dataframe is not a pandas dataframe
def test_query_sql_agent_fail1():
    df = {}
    query = "filter rows where age > 21"
    with pytest.raises(Exception):
        sql_data = query_sql_agent(df, query)

# this should return an exception because the query is not a string
def test_query_sql_agent_fail2():
    df = pd.read_csv("https://raw.githubusercontent.com/pandas-dev/pandas/main/doc/data/titanic.csv")
    query = 123
    with pytest.raises(Exception):
        sql_data = query_sql_agent(df, query)