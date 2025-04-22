from flask import Flask, render_template, request, json
from python import data

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route("/_fetch_data", methods=["GET", "POST"])
def _fetch_data():
    json_request = request.get_json()
    return json.dumps(data.init(json_request))

if __name__ == '__main__':
    app.run(debug=True, port=8000)