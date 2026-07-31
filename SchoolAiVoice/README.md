# SchoolAiVoice Assistant — Campus-Connect

**SchoolAiVoice** is an AI assistant for parents, teachers, and administrators of Campus-Connect.

---

## 🌟 Key Features & Behavior

1. **Attribution**:
   When asked *"Who created you?"*, *"Who made you?"*, or similar questions, the AI responds:
   > **"I was created by Keerthana of 8th std, Flora Carmeli Convent Mysore."**

2. **Natural & Friendly Tone**:
   - Speaks like a warm, empathetic school receptionist or staff member.
   - Summarizes marks naturally (e.g. *"Rahul is performing very well in English and Maths. Science seems to need a little more attention."*).

3. **Parent & Teacher Identity Verification**:
   - Asks parents for their registered phone number and student name before revealing private records.
   - Requires teachers to authenticate before updating marks or attendance.
   - Prompts for confirmation before saving critical marks/attendance updates.

4. **Multi-lingual Support**:
   - Detects user language automatically (English, Hindi, Kannada, Tamil, Telugu, Malayalam).

5. **REST API Communication**:
   - Communicates with Django backend via authenticated REST APIs over HTTPS (`/api/v1/schoolai/chat/`).
