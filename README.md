**Meshplay-Lab** is a personal project exploring modern **microservice-based architecture** through the development of a modular, online gaming platform.

The goal of this project is to create a flexible environment where different parts of the system — such as the web gateway, game engines, and AI opponents — are implemented as independent microservices. Each service can be written in a different programming language and communicate through well-defined interfaces.

This setup allows me to experiment with distributed system design, inter-service communication, and language-specific performance characteristics, while also building a functional platform where users can play various card and board games, either against other players or AI opponents.

In its **initial phase**, Meshplay-Lab focuses on:

* Building a React + TypeScript frontend.
* Developing a Node.js gateway for authentication, REST, and WebSocket communication.
* Implementing game logic services in Java (and later other languages).
* Exploring containerization and deployment strategies with Docker and Docker Compose.