import traceback
try:
    import main_new
    print("SUCCESS")
except Exception as e:
    print("ERROR:")
    traceback.print_exc()
