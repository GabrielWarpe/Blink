# Serviço de extração do Blink — ver README.md para o deploy.
FROM python:3.12-slim

# PyMuPDF e Pillow trazem os binários nas wheels; nada de apt aqui.
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Um worker só: a extração é ligada a CPU e memória, e várias em paralelo no
# mesmo container competem pelos dois. Para escalar, suba mais instâncias.
ENV PORT=8080
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
