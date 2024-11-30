import pytest
import os, sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../app/Api')))
from llm_agent import *
import pandas as pd

# tabular query: agent should return filtered rows where age is 21. verify the passenger ids using ground truth data
def test_query_pandas_agent1():
    df = pd.read_csv("https://raw.githubusercontent.com/pandas-dev/pandas/main/doc/data/titanic.csv")
    query = "filter rows where age is 21"
    try:
        pandas_data = query_pandas_agent(df, query)
        passengers = pandas_data['intermediate_steps'][0][1]['PassengerId']
        gt = open('passengers.txt', 'r+')
        gt = gt.read().split(',')
        gt = [int(i) for i in gt]
        assert set(passengers) == set(gt)
    except Exception as e:
        assert False, f"Error: {e}"

# numerical query: agent should return correct number for the query "how many people with age = 21?"
def test_query_pandas_agent2():
    df = pd.read_csv("https://raw.githubusercontent.com/pandas-dev/pandas/main/doc/data/titanic.csv")
    query = "how many people with age = 21?"
    pandas_data = query_pandas_agent(df, query)
    assert int(pandas_data['output']) == 24

# this should return an exception because the dataframe is not a pandas dataframe
def test_query_pandas_agent_fail1():
    df = {}
    query = "filter rows where age > 21"
    with pytest.raises(Exception):
        pandas_data = query_pandas_agent(df, query)

# this should return an exception because the query is not a string
def test_query_pandas_agent_fail2():
    df = pd.read_csv("https://raw.githubusercontent.com/pandas-dev/pandas/main/doc/data/titanic.csv")
    query = 123
    with pytest.raises(Exception):
        pandas_data = query_pandas_agent(df, query)
