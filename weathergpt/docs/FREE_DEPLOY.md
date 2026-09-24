# Put WeatherGPT online for free

This project is prepared for a free Render web service with a Neon PostgreSQL database. The deploy build seeds the crop and soil reference data from `data/agri_data.xlsx`. Render's free web service can sleep while idle and its local filesystem is temporary, so the database must live outside the web service.

The frontend is also installable as a Progressive Web App (PWA). After it is deployed over HTTPS, Android users can use the **Install app** button in the site (or the browser menu). On iPhone, open the site in Safari, tap **Share**, then **Add to Home Screen**. Weather, chat, maps, and saved data still need an internet connection.

## 1. Create the database

Create a free PostgreSQL project at [Neon](https://neon.com/). Copy its pooled connection string and keep it private. Render will ask for it as `DATABASE_URL`.

## 2. Keep credentials out of Git

The root `.env` is currently tracked by Git. The `.gitignore` already excludes it, but Git continues tracking files once added. From PowerShell in the project folder, untrack secrets and generated local data while keeping them on your computer:

```powershell
git rm --cached -r .env app/__pycache__ instance
```

If any real API key has ever been pushed to GitHub, revoke it and create a replacement before deploying. Old keys remain in Git history even after the `.env` file is removed from the latest version.

## 3. Push the deployment setup

Review what will be pushed before committing. Do not use `git add .` while `.env` is tracked.

```powershell
git add .gitignore requirements.txt run.py render.yaml app data docs *.py
git status --short
git commit -m "Prepare WeatherGPT for free deployment"
git push origin main
```

## 4. Create the Render service

In Render, choose **New → Blueprint**, connect the GitHub repository, and select `render.yaml`. When prompted, enter:

- `DATABASE_URL`: the Neon pooled PostgreSQL connection string
- `AI_API_KEY`: the Groq API key
- `OPENWEATHER_API_KEY`: the OpenWeather API key

Render generates `SECRET_KEY` automatically. The service is configured to use one Gunicorn worker and the free plan.

## Demo limitations

The free web service may take about a minute to wake after idle time, and scheduled weather checks pause while it sleeps. The app currently uses demo OTP login; it does not send real SMS codes. Keep real farmer data out of this public demo until real OTP delivery and production authentication are configured.
