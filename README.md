<div align="center">
  
  ![Logo](/docs/images/Logotipo_Wechat_mini.png)

</div>

This is a base project for the Software Architecture course in 2024/2025. It is a basic application composed of several components.

- **User service**. Express service that handles the insertion of new users in the system.
- **Auth service**. Express service that handles the authentication of users.
- **LLM service**. Express service that handles the communication with the LLM.
- **Gateway service**. Express service that is exposed to the public and serves as a proxy to the two previous ones.
- **Webapp**. React web application that uses the gateway service to allow basic login and new user features.

Both the user and auth service share a Mongo database that is accessed with mongoose.

---
# Patch Notes 📜
You can check the patch notes history on the project wiki or by visiting the following link 👉 https://github.com/MigFeH/Wichat/wiki
