WebRTC Video Chat 🎥💻
A real-time video chat application built with WebRTC, Node.js, and Socket.io. It supports peer-to-peer video calls, screen sharing

Features
Peer-to-peer video chat using WebRTC
Real-time signaling with Socket.io
Screen sharing support
Simple and responsive UI

Project Structure
webrtc-video-chat/
│── public/          # Static assets (HTML, CSS, JS)
│── server.js        # Node.js server with Socket.io
│── script.js        # WebRTC client-side logic
│── style.css        # Styling
│── index.html       # Main UI
│── package.json     # Dependencies and scripts
│── .gitignore       # Ignored files (node_modules, .env, etc.)
│── Procfile         # For Heroku deployment

Installation & Setup
1. Clone the repository:
git clone https://github.com/anushkasahu15/webrtc-video-chat.git
cd webrtc-video-chat


3. Install dependencies:
   npm install


3.Run the server:
    node server.js


4.Open in browser:
   http://localhost:3000


Technologies Used

WebRTC – Peer-to-peer video/audio

Node.js – Backend runtime

Socket.io – Real-time signaling


