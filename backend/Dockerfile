# Use uma imagem leve e compatível
FROM python:3.11-slim

# Define o diretório de trabalho
WORKDIR /app

# Variáveis de ambiente para evitar arquivos .pyc e buffering de logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instala as dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código fonte
COPY . .

# Expõe a porta (O Railway mapeia isso internamente)
EXPOSE 5000

# --- COMANDO DE PRODUÇÃO ---
# Usa Gunicorn (Gerenciador) com Uvicorn (Worker)
# -w 4: Inicia 4 processos simultâneos (bom para performance)
# -k ...: Define a classe do worker como Uvicorn
# -b 0.0.0.0:5000: Escuta em todos os IPs na porta 5000
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:5000", "src.main:app"]
