FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py graph_utils.py game_logic.py ef_endpoints.py pebbles_endpoints.py store.py ./

EXPOSE 5000

CMD ["flask", "--app", "app.py", "run", "--host=0.0.0.0", "--port=5000"]