# Built-in type names by database

Use these exact names in `TypeName` (ermlx) or `Type` (AiSchema; case-insensitive there).
For lengths/precision define a domain (see [ermlx-authoring.md](ermlx-authoring.md)).

## PostgreSQL (`DbType: PostgreSQL`, `--db postgres`)

`boolean`, `smallint`, `integer`, `int`, `bigint`, `numeric`, `decimal`, `real`, `float`,
`double precision`, `money`, `character`, `character varying`, `varchar`, `text`, `date`,
`time`, `time with time zone`, `timestamp without time zone`, `timestamp with time zone`,
`interval`, `uuid`, `json`, `jsonb`, `bytea`

Not built in: `serial`/`bigserial` (use `integer`/`bigint` + `IsIdentity: true`),
`timestamptz` (write `timestamp with time zone`).

## MySQL (`DbType: MySQL`, `--db mysql`)

`BOOLEAN`, `TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, `INTEGER`, `BIGINT`, `DECIMAL`, `NUMERIC`,
`FLOAT`, `REAL`, `DOUBLE`, `CHAR`, `VARCHAR`, `TEXT`, `DATE`, `TIME`, `DATETIME`, `TIMESTAMP`,
`YEAR`, `JSON`, `BLOB`

## SQL Server (`DbType: SQLServer`, `--db sqlserver`)

`bit`, `tinyint`, `smallint`, `int`, `bigint`, `decimal`, `numeric`, `float`, `real`, `money`,
`smallmoney`, `char`, `varchar`, `nchar`, `nvarchar`, `text`, `ntext`, `date`, `time`,
`datetime`, `datetime2`, `datetimeoffset`, `uniqueidentifier`, `binary`, `varbinary`, `xml`, `image`

## Oracle (`DbType: Oracle`, `--db oracle`)

`BOOLEAN`, `INTEGER`, `NUMBER`, `NUMBER(5)`, `NUMBER(19)`, `DECIMAL`, `FLOAT(49)`, `FLOAT(63)`,
`FLOAT(126)`, `CHAR`, `VARCHAR2`, `NVARCHAR2`, `DATE`, `TIME`, `TIMESTAMP`,
`TIMESTAMP WITH TIME ZONE`, `INTERVAL`, `UUID`, `JSON`

## Typical choices

| Purpose | PostgreSQL | MySQL | SQL Server | Oracle |
|---|---|---|---|---|
| Surrogate key | `bigint` + identity | `BIGINT` + identity | `bigint` + identity | `NUMBER(19)` + identity |
| Short text | domain on `character varying` | domain on `VARCHAR` | domain on `nvarchar` | domain on `VARCHAR2` |
| Long text | `text` | `TEXT` | `nvarchar` (domain, max length) | `text` |
| Money | domain on `numeric` (12,2) | domain on `DECIMAL` | domain on `decimal` | domain on `NUMBER` |
| Timestamp | `timestamp with time zone` | `DATETIME` | `datetime2` | `TIMESTAMP` |
| Flag | `boolean` | `BOOLEAN` | `bit` | `BOOLEAN` |
| UUID | `uuid` | domain on `CHAR` (36) | `uniqueidentifier` | `UUID` |
| JSON | `jsonb` | `JSON` | `nvarchar` | `JSON` |
