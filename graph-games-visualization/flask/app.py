from flask import Flask
from flask_cors import CORS
from ef_endpoints import ef_blueprint
from pebbles_endpoints import pebbles_blueprint

app = Flask(__name__)
CORS(app)
app.register_blueprint(ef_blueprint)
app.register_blueprint(pebbles_blueprint)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
