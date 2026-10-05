JARS ONLINE - STEPS (do these on a PC, about 15 minutes)

1. Use a private/incognito window. Sign in to github.com.
2. New repository (name: jars, Private). Click "uploading an existing file".
   Drag in these items from the unzipped folder: the "api" folder, the "public" folder, package.json.
3. Go to vercel.com > Add New > Project > pick "jars" > Deploy. You get a link like https://jars-xxxx.vercel.app
4. Vercel > your project > Settings > Environment Variables. Add the names from ENV-EXAMPLE.txt
   (at least GEMINI_API_KEY and ACCESS_CODE). Then Deployments > ... > Redeploy.
5. Open your link. It asks for the access code once. Test: ask a question.
6. WhatsApp (optional, can be done later): in Meta developers > WhatsApp > Configuration set
   Callback URL = https://YOUR-LINK/api/whatsapp  and Verify token = your WHATSAPP_VERIFY_TOKEN,
   then subscribe to "messages". Send a message to the test number.
7. On your iPhone: open the link in Safari > Share > Add to Home Screen.
8. Log out of everything on the PC and close the window.

If you ever leak a key: delete it where you created it and make a new one, then update it on Vercel.

----------------------------------------------------------------
PC FULL-SCREEN VERSION
----------------------------------------------------------------
After step 5, open:  https://YOUR-LINK/pc.html
- Press the "Full screen" button (or F11).
- To install it like a normal app: in Chrome or Edge click the install icon in the address bar
  (or menu > Install Jars). It then opens in its own window with its own icon.
- Chats are saved in that browser only (not synced between devices).
- Attach images, PDFs and text files up to 3 MB each.
- Shortcuts: Enter = send, Shift+Enter = new line, Esc = stop, Ctrl+K = search chats, Ctrl+M = mic.
- "Web search" shows sources. "Location" is off until you press it. Voice mode talks back.
- The normal page (https://YOUR-LINK/) still has the Jars Tools (poster maker, file maker, today, privacy).
