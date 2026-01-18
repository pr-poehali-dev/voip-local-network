export class WebRTCCall {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: number | null = null;
  
  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  constructor(
    private onRemoteStream: (stream: MediaStream) => void,
    private onCallEnded: () => void
  ) {}

  async startCall(receiverId: number, callerId: number): Promise<{offer: RTCSessionDescriptionInit, callId: number}> {
    this.peerConnection = new RTCPeerConnection(this.configuration);
    
    this.localStream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: false 
    });
    
    this.localStream.getTracks().forEach(track => {
      if (this.peerConnection && this.localStream) {
        this.peerConnection.addTrack(track, this.localStream);
      }
    });

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.onRemoteStream(this.remoteStream);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection?.iceConnectionState === 'disconnected' || 
          this.peerConnection?.iceConnectionState === 'failed' ||
          this.peerConnection?.iceConnectionState === 'closed') {
        this.endCall();
      }
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    const response = await fetch('https://functions.poehali.dev/46bdfd79-a9fb-4730-9257-eeba1e141fb5/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caller_id: callerId,
        receiver_id: receiverId,
        offer: offer
      })
    });

    const data = await response.json();
    this.callId = data.call_id;

    return { offer, callId: data.call_id };
  }

  async answerCall(offer: RTCSessionDescriptionInit, callId: number): Promise<RTCSessionDescriptionInit> {
    this.callId = callId;
    this.peerConnection = new RTCPeerConnection(this.configuration);
    
    this.localStream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: false 
    });
    
    this.localStream.getTracks().forEach(track => {
      if (this.peerConnection && this.localStream) {
        this.peerConnection.addTrack(track, this.localStream);
      }
    });

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.onRemoteStream(this.remoteStream);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection?.iceConnectionState === 'disconnected' || 
          this.peerConnection?.iceConnectionState === 'failed' ||
          this.peerConnection?.iceConnectionState === 'closed') {
        this.endCall();
      }
    };

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await fetch('https://functions.poehali.dev/46bdfd79-a9fb-4730-9257-eeba1e141fb5/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call_id: callId,
        answer: answer
      })
    });

    return answer;
  }

  async endCall() {
    if (this.callId) {
      await fetch('https://functions.poehali.dev/46bdfd79-a9fb-4730-9257-eeba1e141fb5/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: this.callId })
      });
    }

    this.localStream?.getTracks().forEach(track => track.stop());
    this.peerConnection?.close();
    
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.callId = null;
    
    this.onCallEnded();
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}
