\echo 'Delete and recreate spotafly db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE spotafly;
CREATE DATABASE spotafly;
\connect spotafly

\i spotafly-schema.sql

\echo 'Delete and recreate spotafly_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE spotafly_test;
CREATE DATABASE spotafly_test;
\connect spotafly_test

\i spotafly-schema.sql
