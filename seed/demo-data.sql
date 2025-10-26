-- Demo data for SignTogether application
-- This file contains sample data to demonstrate the platform's capabilities

-- Insert sample meeting
INSERT INTO meetings (id, roomName, title, description, startTime, isActive) VALUES 
('demo_meeting_001', 'accessibility-demo', 'Accessibility in Tech: Building Inclusive Products', 'A demo meeting showcasing SignTogether accessibility features', '2024-01-15 10:00:00', 1);

-- Insert sample participants
INSERT INTO participants (id, name, meetingId, joinTime, isActive, role) VALUES 
('participant_001', 'Sarah Chen', 'demo_meeting_001', '2024-01-15 10:00:00', 1, 'moderator'),
('participant_002', 'Alex Rivera', 'demo_meeting_001', '2024-01-15 10:00:30', 1, 'participant'),
('participant_003', 'Jordan Kim', 'demo_meeting_001', '2024-01-15 10:01:00', 1, 'participant'),
('participant_004', 'Taylor Johnson', 'demo_meeting_001', '2024-01-15 10:01:15', 1, 'participant');

-- Insert sample transcripts
INSERT INTO transcripts (id, meetingId, speakerId, speakerName, text, confidence, timestamp, language, isProcessed) VALUES 
('transcript_001', 'demo_meeting_001', 'participant_001', 'Sarah Chen', 'Good morning everyone! Welcome to our accessibility workshop. Today we will be discussing how to build more inclusive products.', 0.96, '2024-01-15 10:00:15', 'en', 1),
('transcript_002', 'demo_meeting_001', 'participant_002', 'Alex Rivera', 'Thanks Sarah. I am excited to share some insights from the deaf community perspective on product design.', 0.94, '2024-01-15 10:00:45', 'en', 1),
('transcript_003', 'demo_meeting_001', 'participant_003', 'Jordan Kim', 'I would love to hear about technical implementations. What are the biggest challenges we face when building accessible features?', 0.97, '2024-01-15 10:01:12', 'en', 1),
('transcript_004', 'demo_meeting_001', 'participant_004', 'Taylor Johnson', 'Great question Jordan. One major challenge is ensuring our solutions work across different assistive technologies.', 0.95, '2024-01-15 10:01:35', 'en', 1),
('transcript_005', 'demo_meeting_001', 'participant_001', 'Sarah Chen', 'Let us start with captions. Alex, can you tell us about your experience with live captioning in meetings?', 0.98, '2024-01-15 10:02:00', 'en', 1),
('transcript_006', 'demo_meeting_001', 'participant_002', 'Alex Rivera', 'Absolutely. Real-time captions are crucial for participation. The accuracy and speed make a huge difference in following conversations.', 0.93, '2024-01-15 10:02:20', 'en', 1),
('transcript_007', 'demo_meeting_001', 'participant_003', 'Jordan Kim', 'What about gesture recognition? How important is it to detect sign language in video calls?', 0.96, '2024-01-15 10:02:45', 'en', 1),
('transcript_008', 'demo_meeting_001', 'participant_004', 'Taylor Johnson', 'It is revolutionary. When the system can identify who is signing, it helps hearing participants know who is speaking.', 0.94, '2024-01-15 10:03:10', 'en', 1),
('transcript_009', 'demo_meeting_001', 'participant_002', 'Alex Rivera', 'Exactly. And detecting common gestures like yes or no can speed up communication significantly.', 0.95, '2024-01-15 10:03:35', 'en', 1),
('transcript_010', 'demo_meeting_001', 'participant_001', 'Sarah Chen', 'That is fascinating. How do we ensure these AI systems are trained on diverse sign languages and dialects?', 0.97, '2024-01-15 10:04:00', 'en', 1);

-- Insert sample gestures
INSERT INTO gestures (id, meetingId, userId, userName, gestureType, confidence, timestamp, metadata) VALUES 
('gesture_001', 'demo_meeting_001', 'participant_002', 'Alex Rivera', 'signing_detected', 0.89, '2024-01-15 10:02:25', '{"description": "Active signing detected during speech"}'),
('gesture_002', 'demo_meeting_001', 'participant_004', 'Taylor Johnson', 'yes', 0.92, '2024-01-15 10:03:15', '{"description": "Nodding gesture indicating agreement"}'),
('gesture_003', 'demo_meeting_001', 'participant_002', 'Alex Rivera', 'thank_you', 0.87, '2024-01-15 10:03:40', '{"description": "Thank you gesture in response to comment"}'),
('gesture_004', 'demo_meeting_001', 'participant_003', 'Jordan Kim', 'hello', 0.91, '2024-01-15 10:04:05', '{"description": "Waving gesture during introduction"}'),
('gesture_005', 'demo_meeting_001', 'participant_004', 'Taylor Johnson', 'signing_detected', 0.88, '2024-01-15 10:03:12', '{"description": "Sign language communication detected"}');

-- Insert sample summaries
INSERT INTO summaries (id, meetingId, content, summaryType, generatedAt, language) VALUES 
('summary_001', 'demo_meeting_001', 'This accessibility workshop focused on building inclusive products for deaf and hearing users. Key discussion points included the importance of real-time captions, gesture recognition technology, and ensuring AI systems work with diverse sign languages. Participants shared insights on technical implementation challenges and the impact of accessibility features on user participation. The meeting highlighted how proper accessibility features benefit all users, not just those with disabilities.', 'meeting', '2024-01-15 10:05:00', 'en'),
('summary_002', 'demo_meeting_001', '• Research diverse sign language datasets for AI training\n• Implement real-time caption accuracy improvements\n• Test gesture recognition across different cultural contexts\n• Create accessibility guidelines for development teams\n• Schedule follow-up meeting to review progress on accessibility initiatives', 'action_items', '2024-01-15 10:05:30', 'en'),
('summary_003', 'demo_meeting_001', '• Real-time captions are crucial for deaf participation in meetings\n• Gesture recognition helps identify active speakers in sign language\n• AI systems need training on diverse sign languages and dialects\n• Accessibility features benefit all users, not just those with disabilities\n• Technical implementation requires consideration of assistive technologies\n• Speed and accuracy of captions directly impact user experience', 'key_points', '2024-01-15 10:06:00', 'en');

-- Insert sample analytics data
INSERT INTO analytics (id, meetingId, eventType, value, metadata, timestamp) VALUES 
('analytics_001', 'demo_meeting_001', 'caption_accuracy', 0.95, '{"model": "deepgram-nova-2", "language": "en"}', '2024-01-15 10:02:30'),
('analytics_002', 'demo_meeting_001', 'gesture_confidence', 0.89, '{"gesture_type": "signing_detected", "model": "gemini-vision"}', '2024-01-15 10:02:25'),
('analytics_003', 'demo_meeting_001', 'latency', 1.2, '{"service": "deepgram", "metric": "transcription_latency_seconds"}', '2024-01-15 10:03:00'),
('analytics_004', 'demo_meeting_001', 'gesture_confidence', 0.92, '{"gesture_type": "yes", "model": "gemini-vision"}', '2024-01-15 10:03:15'),
('analytics_005', 'demo_meeting_001', 'caption_accuracy', 0.97, '{"model": "deepgram-nova-2", "language": "en"}', '2024-01-15 10:04:00'),
('analytics_006', 'demo_meeting_001', 'summary_generation_time', 3.4, '{"model": "claude-3.5-sonnet", "type": "meeting_summary"}', '2024-01-15 10:05:00');
