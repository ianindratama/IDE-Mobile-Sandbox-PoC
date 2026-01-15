import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

/// Connection state enum
enum ConnectionState {
  disconnected,
  connecting,
  connected,
  error,
}

/// Socket service for real-time communication with the server
class SocketService extends ChangeNotifier {
  io.Socket? _socket;
  ConnectionState _connectionState = ConnectionState.disconnected;
  String? _currentCode;
  String? _errorMessage;
  String _serverUrl = 'http://10.0.2.2:3001'; // Default for Android emulator

  // Getters
  ConnectionState get connectionState => _connectionState;
  String? get currentCode => _currentCode;
  String? get errorMessage => _errorMessage;
  bool get isConnected => _connectionState == ConnectionState.connected;

  /// Set the server URL (use 10.0.2.2 for Android emulator, localhost for iOS simulator)
  void setServerUrl(String url) {
    _serverUrl = url;
  }

  /// Connect to server and join a session
  Future<bool> joinSession(String sessionCode) async {
    _connectionState = ConnectionState.connecting;
    _errorMessage = null;
    notifyListeners();

    try {
      // Initialize socket connection
      _socket = io.io(_serverUrl, <String, dynamic>{
        'transports': ['websocket', 'polling'],
        'autoConnect': false,
        'forceNew': true,
      });

      // Set up event listeners
      _socket!.onConnect((_) {
        debugPrint('[Socket] Connected to server');
        
        // Join the session
        _socket!.emitWithAck('join-session', {'code': sessionCode}, ack: (data) {
          if (data['success'] == true) {
            _connectionState = ConnectionState.connected;
            debugPrint('[Socket] Joined session: $sessionCode');
          } else {
            _connectionState = ConnectionState.error;
            _errorMessage = data['error'] ?? 'Failed to join session';
            debugPrint('[Socket] Failed to join session: ${data['error']}');
          }
          notifyListeners();
        });
      });

      _socket!.onConnectError((error) {
        debugPrint('[Socket] Connection error: $error');
        _connectionState = ConnectionState.error;
        _errorMessage = 'Failed to connect to server';
        notifyListeners();
      });

      _socket!.onDisconnect((_) {
        debugPrint('[Socket] Disconnected from server');
        _connectionState = ConnectionState.disconnected;
        notifyListeners();
      });

      // Listen for code updates
      _socket!.on('code-update', (data) {
        debugPrint('[Socket] Received code update');
        _currentCode = data['code'];
        notifyListeners();
      });

      // Listen for session end
      _socket!.on('session-ended', (data) {
        debugPrint('[Socket] Session ended: ${data['reason']}');
        _connectionState = ConnectionState.disconnected;
        _errorMessage = 'Session ended: ${data['reason']}';
        notifyListeners();
      });

      // Connect
      _socket!.connect();
      
      // Wait a bit for connection
      await Future.delayed(const Duration(seconds: 2));
      
      return _connectionState == ConnectionState.connected;
    } catch (e) {
      debugPrint('[Socket] Error: $e');
      _connectionState = ConnectionState.error;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Disconnect from the server
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _connectionState = ConnectionState.disconnected;
    _currentCode = null;
    _errorMessage = null;
    notifyListeners();
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}
