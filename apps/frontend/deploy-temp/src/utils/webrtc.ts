import { supabase } from './supabaseClient';

// Message types for signaling
export interface SignalMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  sender: string;
  receiver: string;
  sessionId: string;
  payload: any;
}

// Chat message structure
export interface ChatMessage {
  text: string;
  sender: string;
  timestamp: number;
}

/**
 * WebRTC connection manager for peer-to-peer chat
 */
export class WebRTCConnection {
  private connection: RTCPeerConnection;
  private channel: RTCDataChannel | null = null;
  private localAddress: string;
  private remoteAddress: string;
  private sessionId: string;
  private onMessageCallback: ((message: ChatMessage) => void) | null = null;
  private onStateChangeCallback: ((state: RTCIceConnectionState) => void) | null = null;
  
  constructor(localAddress: string, remoteAddress: string, sessionId: string) {
    this.localAddress = localAddress;
    this.remoteAddress = remoteAddress;
    this.sessionId = sessionId;
    
    // Configure ICE servers (STUN/TURN)
    this.connection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });
    
    // Set up event handlers
    this.setupEventListeners();
    
    // Set up signaling
    this.setupSignaling();
  }
  
  /**
   * Set up event listeners for the RTCPeerConnection
   */
  private setupEventListeners() {
    // Handle ICE candidate events
    this.connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          sender: this.localAddress,
          receiver: this.remoteAddress,
          sessionId: this.sessionId,
          payload: event.candidate
        });
      }
    };
    
    // Handle connection state changes
    this.connection.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state: ${this.connection.iceConnectionState}`);
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(this.connection.iceConnectionState);
      }
    };
    
    // Handle data channel events
    this.connection.ondatachannel = (event) => {
      console.log('[WebRTC] Received data channel');
      this.setupDataChannel(event.channel);
    };
  }
  
  /**
   * Set up a data channel for chat
   */
  private setupDataChannel(channel: RTCDataChannel | null = null) {
    if (channel) {
      this.channel = channel;
    } else {
      // Create a new channel if one wasn't provided
      this.channel = this.connection.createDataChannel('chat', {
        ordered: true
      });
    }
    
    if (this.channel) {
      this.channel.onopen = () => {
        console.log('[WebRTC] Data channel opened');
      };
      
      this.channel.onclose = () => {
        console.log('[WebRTC] Data channel closed');
      };
      
      this.channel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ChatMessage;
          console.log('[WebRTC] Message received:', message);
          if (this.onMessageCallback) {
            this.onMessageCallback(message);
          }
        } catch (err) {
          console.error('[WebRTC] Error parsing message:', err);
        }
      };
    }
  }
  
  /**
   * Set up signaling through Supabase
   */
  private setupSignaling() {
    // Subscribe to signaling channel
    const channel = supabase
      .channel(`session:${this.sessionId}:signal`)
      .on(
        'broadcast',
        { event: 'signal' },
        (payload: { payload: SignalMessage }) => {
          const signal = payload.payload;
          
          // Only process messages intended for this user
          if (signal.receiver !== this.localAddress) return;
          
          console.log('[WebRTC] Received signal:', signal.type);
          
          switch (signal.type) {
            case 'offer':
              this.handleOffer(signal.payload);
              break;
            case 'answer':
              this.handleAnswer(signal.payload);
              break;
            case 'ice-candidate':
              this.handleIceCandidate(signal.payload);
              break;
          }
        }
      )
      .subscribe();
  }
  
  /**
   * Send a signal message through Supabase
   */
  private async sendSignal(signal: SignalMessage) {
    try {
      await supabase
        .channel(`session:${this.sessionId}:signal`)
        .send({
          type: 'broadcast',
          event: 'signal',
          payload: signal
        });
    } catch (err) {
      console.error('[WebRTC] Error sending signal:', err);
    }
  }
  
  /**
   * Handle an incoming offer
   */
  private async handleOffer(offer: RTCSessionDescriptionInit) {
    try {
      await this.connection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.connection.createAnswer();
      await this.connection.setLocalDescription(answer);
      
      this.sendSignal({
        type: 'answer',
        sender: this.localAddress,
        receiver: this.remoteAddress,
        sessionId: this.sessionId,
        payload: answer
      });
    } catch (err) {
      console.error('[WebRTC] Error handling offer:', err);
    }
  }
  
  /**
   * Handle an incoming answer
   */
  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      await this.connection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error('[WebRTC] Error handling answer:', err);
    }
  }
  
  /**
   * Handle an incoming ICE candidate
   */
  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('[WebRTC] Error handling ICE candidate:', err);
    }
  }
  
  /**
   * Initiate a connection as the caller
   */
  public async initiateConnection() {
    try {
      // Create a data channel first
      this.setupDataChannel();
      
      // Create an offer
      const offer = await this.connection.createOffer();
      await this.connection.setLocalDescription(offer);
      
      // Send the offer
      this.sendSignal({
        type: 'offer',
        sender: this.localAddress,
        receiver: this.remoteAddress,
        sessionId: this.sessionId,
        payload: offer
      });
    } catch (err) {
      console.error('[WebRTC] Error initiating connection:', err);
    }
  }
  
  /**
   * Send a chat message to the peer
   */
  public sendMessage(text: string) {
    if (!this.channel || this.channel.readyState !== 'open') {
      console.error('[WebRTC] Cannot send message - channel not open');
      return false;
    }
    
    const message: ChatMessage = {
      text,
      sender: this.localAddress,
      timestamp: Date.now()
    };
    
    try {
      this.channel.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('[WebRTC] Error sending message:', err);
      return false;
    }
  }
  
  /**
   * Set a callback for incoming messages
   */
  public onMessage(callback: (message: ChatMessage) => void) {
    this.onMessageCallback = callback;
  }
  
  /**
   * Set a callback for connection state changes
   */
  public onStateChange(callback: (state: RTCIceConnectionState) => void) {
    this.onStateChangeCallback = callback;
  }
  
  /**
   * Close the connection
   */
  public close() {
    if (this.channel) {
      this.channel.close();
    }
    this.connection.close();
  }
}