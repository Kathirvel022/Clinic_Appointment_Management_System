import pymysql

try:
    connection = pymysql.connect(host='localhost', user='root', password='2526')
    with connection.cursor() as cursor:
        cursor.execute("CREATE DATABASE IF NOT EXISTS clinic_db")
    connection.commit()
    print("Database clinic_db ensured.")
except Exception as e:
    print(f"Error: {e}")
