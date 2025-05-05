<div align="center">
  
  [![Actions Status](https://github.com/arquisoft/wichat_es2b/workflows/CI%20for%20wichat_es2b/badge.svg)](https://github.com/arquisoft/wichat_es2b/actions)
  [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es2b&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es2b)
  [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es2b&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es2b)
  
  ![Logo](/docs/images/Logotipo_Wechat_mini.png)

</div>

This is a base project for the Software Architecture course in 2024/2025. It is a basic application composed of several components.

- **User service**. Express service that handles the insertion of new users in the system.
- **Auth service**. Express service that handles the authentication of users.
- **LLM service**. Express service that handles the communication with the LLM.
- **Gateway service**. Express service that is exposed to the public and serves as a proxy to the two previous ones.
- **Webapp**. React web application that uses the gateway service to allow basic login and new user features.

Both the user and auth service share a Mongo database that is accessed with mongoose.
