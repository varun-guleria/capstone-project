import marshal, dis
with open('PrepMate-backend/server/embedding-service/__pycache__/main.cpython-313.pyc', 'rb') as f:
    f.seek(16)
    c = marshal.load(f)

def walk(code):
    print(f"\n--- Code object: {code.co_name} ---")
    dis.dis(code)
    for const in code.co_consts:
        if hasattr(const, 'co_code'):
            walk(const)

walk(c)
