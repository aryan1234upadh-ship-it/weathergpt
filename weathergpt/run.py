import os

from app import create_app
from app.alerts import start_scheduler

app = create_app()

if __name__ == "__main__":
    # Flask's debug reloader starts two processes; only the child runs the timer
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        start_scheduler(app)
    app.run(debug=True)
elif os.getenv("START_SCHEDULER", "false").lower() == "true":
    # The free Render blueprint uses one Gunicorn worker. Its scheduler runs
    # while the service is awake; free instances still sleep when idle.
    start_scheduler(app)
