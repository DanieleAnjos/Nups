#!/bin/bash

# Configurações
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=nups_db_dev
DB_USER=root
DB_PASSWORD=Amor66992712.
DUMP_FILE="./dump.sql"

mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $DUMP_FILE

# Verificar se o dump foi criado com sucesso
if [ $? -eq 0 ]; then
  echo "Dados exportados com sucesso para $DUMP_FILE."
else
  echo "Erro ao exportar dados."
  exit 1
fi