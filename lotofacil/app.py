import random
from flask import Flask, jsonify, request

app = Flask(__name__)

def gerar_base_tabelada(ultimos_resultados):
    pool_total = list(range(1, 26))
    dezenas_base = random.sample(pool_total, 21)
    dezenas_fixas = random.sample(dezenas_base, 4)
    return {
        "base_21": sorted(dezenas_base),
        "fixas_4": sorted(dezenas_fixas)
    }

@app.route('/gerar_motor', methods=['POST'])
def api_gerar_motor():
    dados_req = request.get_json() or {}
    ultimos = dados_req.get('ultimos_resultados', [])
    dados = gerar_base_tabelada(ultimos)
    return jsonify(dados)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)