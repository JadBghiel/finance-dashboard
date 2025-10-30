# finance-dashboard
💰 Personal Finance Dashboard / Track income, expenses, savings, and investments with charts, AI assistant, and multi-currency support.

## LAUNCH
(eventually will have a one liner command to launch + access online with vercel and render)
you will need 2 terminal
 ```
 // in ./backend
uvicorn app.main:app --reload
// if you dont have python:
python3 -m venv venv 
pip install -r requirements.txt
source venv/bin/activate


// in frontend:
npm start
 ```



## FEATURES IMPLEMENTED


## FEATURES TO IMPLEMENT

## KNOWN ISSUES:
- in the dashbaord, seems like the charts appears only for EUR ? not sure its not showing all
- in the dashbaord, the viz doesnt seem to support all timeframes and accounts its very inconsistent
- below the breakdown part, should display desc instead of ISO

## GENERATE ENTRIES
You can use the python script to generate entries for both INCOME and EXPENSES, and test the project

In the root of the project (with python activated or installed):
 ``` python3 dashbaord/backend/scripts/seed_transactions.py --incomes <amount> --expenses <amount> ``` 

