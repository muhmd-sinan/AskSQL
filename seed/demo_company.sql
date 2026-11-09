-- Demo data for AskSQL. Run this once against your hosted MySQL database
-- as the admin user (not the read-only demo user).
--
--   mysql -h <host> -P <port> -u <admin> -p --ssl-mode=REQUIRED < seed/demo_company.sql
--
-- Then create the read-only user at the bottom of this file.

CREATE DATABASE IF NOT EXISTS company_db;
USE company_db;

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  location VARCHAR(50) NOT NULL
);

CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  department_id INT NOT NULL,
  job_title VARCHAR(60) NOT NULL,
  salary DECIMAL(10,2) NOT NULL,
  hire_date DATE NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  country VARCHAR(50) NOT NULL,
  signup_date DATE NOT NULL
);

CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  category VARCHAR(40) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  order_date DATE NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO departments (name, location) VALUES
  ('Engineering', 'Bengaluru'),
  ('Sales', 'Mumbai'),
  ('Marketing', 'Delhi'),
  ('Finance', 'Mumbai'),
  ('HR', 'Chennai');

INSERT INTO employees (first_name, last_name, department_id, job_title, salary, hire_date) VALUES
  ('Aarav',  'Sharma',  1, 'Senior Engineer',    145000.00, '2020-03-15'),
  ('Diya',   'Patel',   1, 'Software Engineer',  110000.00, '2022-07-01'),
  ('Rohan',  'Mehta',   1, 'Engineering Lead',   175000.00, '2018-11-20'),
  ('Isha',   'Nair',    2, 'Sales Manager',      120000.00, '2019-05-10'),
  ('Kabir',  'Singh',   2, 'Sales Executive',     80000.00, '2023-01-09'),
  ('Meera',  'Iyer',    2, 'Sales Executive',     82000.00, '2022-09-12'),
  ('Vikram', 'Rao',     3, 'Marketing Manager',  115000.00, '2019-08-25'),
  ('Ananya', 'Das',     3, 'Content Strategist',  78000.00, '2023-04-03'),
  ('Arjun',  'Kapoor',  4, 'Financial Analyst',   95000.00, '2021-02-14'),
  ('Sneha',  'Reddy',   4, 'Finance Director',   160000.00, '2017-06-30'),
  ('Neha',   'Joshi',   5, 'HR Manager',         105000.00, '2020-10-05'),
  ('Rahul',  'Verma',   5, 'Recruiter',           72000.00, '2024-02-19');

INSERT INTO customers (name, country, signup_date) VALUES
  ('Northwind Traders', 'USA',       '2023-01-15'),
  ('Globex Corp',       'Germany',   '2023-03-22'),
  ('Initech',           'USA',       '2023-06-01'),
  ('Umbrella Ltd',      'UK',        '2023-08-19'),
  ('Stark Industries',  'USA',       '2024-01-07'),
  ('Wayne Enterprises', 'Canada',    '2024-02-28'),
  ('Hooli',             'India',     '2024-04-11'),
  ('Soylent Co',        'Australia', '2024-05-30');

INSERT INTO products (name, category, price) VALUES
  ('Analytics Suite',  'Software', 499.00),
  ('Cloud Storage 1TB','Software',  99.00),
  ('Laptop Pro 15',    'Hardware', 1450.00),
  ('Wireless Mouse',   'Hardware',   29.00),
  ('Onboarding Pack',  'Services', 750.00),
  ('Support Plan',     'Services', 300.00);

INSERT INTO orders (customer_id, product_id, quantity, order_date) VALUES
  (1, 1, 2, '2024-01-10'),
  (1, 3, 5, '2024-02-14'),
  (2, 2, 10, '2024-02-20'),
  (2, 6, 1, '2024-03-05'),
  (3, 4, 40, '2024-03-18'),
  (3, 1, 1, '2024-04-02'),
  (4, 5, 2, '2024-04-21'),
  (5, 3, 8, '2024-05-09'),
  (5, 1, 3, '2024-05-30'),
  (6, 2, 25, '2024-06-12'),
  (6, 6, 2, '2024-06-25'),
  (7, 4, 15, '2024-07-08'),
  (7, 3, 2, '2024-07-19'),
  (8, 5, 1, '2024-08-02'),
  (8, 1, 1, '2024-08-27');

-- ---------------------------------------------------------------------------
-- Demo user (full access to company_db only). Replace the password, and use the
-- same values in DEMO_DB_USER / DEMO_DB_PASSWORD. Re-run this file to reset the data.
-- ---------------------------------------------------------------------------
-- CREATE USER 'asksql_demo'@'%' IDENTIFIED BY 'CHANGE_ME_LONG_RANDOM_PASSWORD';
-- GRANT ALL ON company_db.* TO 'asksql_demo'@'%';
