const socket = io();
const roomInput = document.getElementById('roomInput');
const roomDisplay = document.getElementById('roomDisplay');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const participantList = document.getElementById('participant-list');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-message');

let localStream;
let remoteStream;
let peerConnection;
let currentRoom = null;
let username = prompt('Enter your username:');

const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

async function startCamera() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
  } catch (error) {
    alert('Camera/mic access denied');
  }
}

function createRoom() {
  const roomName = roomInput.value.trim();
  if (roomName) {
    currentRoom = roomName;
    socket.emit('join', { room: roomName, username });
    roomDisplay.textContent = `Room: ${roomName}`;
    initializePeerConnection();
  }
}

function joinRoom() {
  createRoom();
}

function generateRoom() {
  const id = Math.random().toString(36).substring(2, 8);
  roomInput.value = id;
}

function copyRoom() {
  navigator.clipboard.writeText(roomInput.value);
  alert('Room ID copied!');
}

function initializePeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    if (!remoteStream) {
      remoteStream = new MediaStream();
      remoteVideo.srcObject = remoteStream;
    }
    remoteStream.addTrack(event.track);
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', { room: currentRoom, candidate: event.candidate });
    }
  };
}

socket.on('offer', async ({ offer }) => {
  if (!peerConnection) initializePeerConnection();
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { room: currentRoom, answer });
});

socket.on('answer', async ({ answer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('candidate', async ({ candidate }) => {
  if (peerConnection) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

async function createOffer() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', { room: currentRoom, offer });
}

function sendMessage() {
  const message = chatInput.value.trim();
  if (message && currentRoom) {
    socket.emit('chat-message', { room: currentRoom, message, username });
    chatInput.value = '';
  }
}

socket.on('chat-message', (data) => {
  const msg = document.createElement('p');
  const time = new Date(data.timestamp).toLocaleTimeString();
  msg.innerHTML = `<strong>[${time}] ${data.sender}:</strong> ${data.message}`;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('room-data', ({ users }) => {
  participantList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.textContent = user.username;
    participantList.appendChild(li);
  });
});

socket.on('user-joined', ({ username }) => {
  const li = document.createElement('li');
  li.textContent = username;
  participantList.appendChild(li);
});

socket.on('user-left', ({ userId }) => {
  const items = participantList.querySelectorAll('li');
  items.forEach((item) => {
    if (item.textContent.includes(userId)) {
      item.remove();
    }
  });
});

function toggleMic() {
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
}

function toggleCamera() {
  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
}

async function shareScreen() {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];

    peerConnection.getSenders().forEach((sender) => {
      if (sender.track.kind === 'video') {
        sender.replaceTrack(screenTrack);
      }
    });

    screenTrack.onended = () => {
      peerConnection.getSenders().forEach((sender) => {
        if (sender.track.kind === 'video') {
          sender.replaceTrack(localStream.getVideoTracks()[0]);
        }
      });
    };
  } catch (err) {
    alert('Screen sharing failed.');
  }
}

async function shareScreen() {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];

    // Replace the current video track with the screen track
    peerConnection.getSenders().forEach((sender) => {
      if (sender.track.kind === 'video') {
        sender.replaceTrack(screenTrack);
      }
    });

    // When screen sharing ends, revert to camera
    screenTrack.onended = () => {
      peerConnection.getSenders().forEach((sender) => {
        if (sender.track.kind === 'video') {
          sender.replaceTrack(localStream.getVideoTracks()[0]);
        }
      });
    };
  } catch (err) {
    alert('Screen sharing failed or was cancelled.');
    console.error('Screen sharing error:', err);
  }
}


function sendEmoji(emoji) {
  if (currentRoom) {
    socket.emit('chat-message', { room: currentRoom, message: emoji, username });
  }
}

startCamera();
