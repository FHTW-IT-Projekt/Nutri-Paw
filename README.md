# Nutri-Paw

A website with a backend designed for applications to track and monitor pet food and medication intake.

## Setup

Follow these steps to get the project running on your local machine:

1. **Install NVM for Windows** Download and run the installer: [nvm-setup.exe](https://github.com/coreybutler/nvm-windows/releases/download/1.2.2/nvm-setup.exe).

2. **Install Node.js** Open your Command Prompt (`cmd`) and run the following commands to install and use the latest version of Node.js:
    ```bash
    nvm install latest
    nvm use <installed_version_number>
   
3.  **Install Dependencies and Start the Server** Open a new Command Prompt inside the project directory and run:
    ```bash
    npm install
    node server.js

4. **Verify the Application** Once running, you should see the following message in your terminal
5. 
**Nutripaw app listening on port 3000**

You can access the main application at: http://localhost:3000

To verify the backend is working and see dummy data, try visiting: http://localhost:3000/api/getSampleData

## FYIs

1. type modules statt common js, d.h. es darf nur noch import/export verwnedet werden.

2. alle backend files die bestimmte pages betreffen sind in dem Ordner routes in Nutri-Paw zu findne

3. in der server.js cors hinzugefüt nachdem cors in Projektordnern installiert wurde. Andere Personen müssen jetzt nicht erneut CORS installieren sondern nur npm install im ordner Nutri-Paw aufsführen
   -> die metadaten von cors befinden sich jetzt in package.json

4. wenn ein backendpage geshchrieben wurde muss es auch eine file geben die, das frontend mit derm backend und der server.js verbindet. für pet.js im Backend ist es z.b. testfetch im frontend

5. die backend pages müssen auch an die server.js weiter gegeben werden, denn sie korrdiniert die Anfragen vom frontend. Dazu zb in die server.js so etwas schreiben wie import petRoutes from "'./routes/pet.js'"

Alles klar, mein Fehler. Hier ist das README für dein Team im gewünschten, direkten und stichpunktartigen Stil, das genau erklärt, was gemacht wurde und wie Ethereal Email funktioniert.

📧 Feature Update: E-Mail-Reminder (Cronjob & Nodemailer)
Wir haben die Logik für automatisierte E-Mail-Erinnerungen eingebaut (z. B. für Medikamente oder Fütterung). Damit bei euch lokal alles läuft und nichts crasht, beachtet bitte folgende Punkte:

🛠️ 1. Was ihr installieren müsst
Bitte zieht euch den aktuellen Stand der Branch und installiert die neuen Pakete einmalig im Backend-Ordner (Nutri-Paw):

Führt im Terminal aus: npm install nodemailer node-cron

(Kurze Info: nodemailer ist das Tool, das die E-Mails verschickt. node-cron ist unser Timer in der server.js, der im Hintergrund auf die Uhr schaut und checkt, ob Mails fällig sind).

🧪 2. Wie wir lokal testen (ohne Spam & sicher)
Damit wir beim Entwickeln keine echten Postfächer zuspammen, nicht in Spam-Filtern hängen bleiben und keine privaten Passwörter im Code stehen haben, nutzen wir Ethereal Email.

Was ist das? Ein Fake-E-Mail-Service extra für Entwickler. Er fängt alle Test-Mails unseres lokalen Servers ab, anstatt sie wirklich ins Internet zu feuern.

Wie funktioniert's? Geht auf ethereal.email und klickt auf "Create Ethereal Account". Ihr bekommt dort sofort Fake-Logindaten generiert.

Was müsst ihr tun? Tragt diese generierte E-Mail und das Passwort bei euch in die lokale .env-Datei ein:

EMAIL_USER=deine_generierte_mail@ethereal.email

EMAIL_PASS=dein_generiertes_passwort

Mails checken: Wenn unser Cronjob losläuft, könnt ihr euch die verschickten Test-Mails direkt auf der Ethereal-Website im Tab "Messages" ansehen.

🗄️ 3. Info zur Datenbank & Frontend-Schnittstelle

Neue Route: Wenn im Frontend eine Checkbox geklickt wird, gehen die Daten jetzt an POST /api/reminders.

Neue Tabelle: Dafür gibt es in der Datenbank jetzt die Tabelle reminders. Dort wird genau gespeichert, welches Tier, für welche Aufgabe, zu welcher genauen Uhrzeit (remind_time) eine Mail braucht.

Dynamischer Versand: Der Cronjob sucht sich die Empfänger-E-Mail-Adressen automatisch über einen Datenbank-JOIN aus der users-Tabelle zusammen, sobald die exakte Uhrzeit erreicht ist.

Zum lokalen Testen: Legt euch in eurer DB einen Dummy-User an und tragt manuell eine Erinnerung in eure reminders-Tabelle ein, die ein paar Minuten in der Zukunft liegt, um den Versand zu triggern.



