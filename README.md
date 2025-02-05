# Voice Channels (Simple Discord)

This project provides the functionality to create and manage voice channels (Voice Channels) using a **React** client, an **Express.js** server, and a **PostgreSQL** database. Users can join channels with or without an account, with certain limitations for guests. Below is a summary of the features and instructions on how to set up and run the project.

## Features

- **Anonymous Access**: Users can join application without creating an account, but with limited privileges (like deleting created channel of their own).

- **Create Voice Channels**: Any user can create a voice channel.

- **Join and leave Existing Channels**: Users can join or leave existing channels that have been created by themselves or others (each user can only be on one channel in time).

- **Channel users list**: There is a list of users who joined channels for each channel.

- **Ability to mute a user in channel**: Users can choose other users to mute their voice in a channel.

- **Voice Activity Status**:
  - **Green** indicates at least one user is actively talking.
  - **Yellow** indicates no one is currently talking.


## Requirements

- **docker** (You should have docker desktop to run docker commands)

## Run the code

1. **Clone the repository**:
   ```bash 
   git clone https://github.com/Agsamani/VoiceLink.git
2. **Run Docker Compose command in the main folder of project**
    
    in order to build images and run 3 clients in 3 different ports run:
    ```bash
    docker-compose up --build --scale client=3
3. **Get client ports**

    run this command in a new terminal to get client servers ports
    ```bash
    docker ps