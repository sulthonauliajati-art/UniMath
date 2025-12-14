# UniMath API Documentation

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication
All protected endpoints require Bearer token in header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Student Identify
Check if student exists by NISN or name.

```
POST /api/auth/student/identify
```

**Request:**
```json
{
  "identifier": "1234567890"  // NISN or name
}
```

**Response (exists):**
```json
{
  "exists": true,
  "user": {
    "id": "ST001",
    "name": "Budi Santoso",
    "nisn": "1234567890",
    "passwordStatus": "SET"
  }
}
```

**Response (not found):**
```json
{
  "exists": false
}
```

### Student Set Password
Set password for new student account.

```
POST /api/auth/student/set-password
```

**Request:**
```json
{
  "userId": "ST002",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "mock_student_token_...",
  "user": { ... }
}
```

### Student Login
```
POST /api/auth/student/login
```

**Request:**
```json
{
  "userId": "ST001",
  "password": "siswa123"
}
```

**Response:**
```json
{
  "token": "mock_student_token_...",
  "user": {
    "id": "ST001",
    "role": "STUDENT",
    "name": "Budi Santoso",
    "nisn": "1234567890",
    "passwordStatus": "SET"
  }
}
```

### Teacher Register
```
POST /api/auth/teacher/register
```

**Request:**
```json
{
  "name": "Guru Baru",
  "email": "guru.baru@sekolah.com",
  "password": "password123"
}
```

### Teacher Login
```
POST /api/auth/teacher/login
```

**Request:**
```json
{
  "email": "guru@demo.com",
  "password": "demo123"
}
```

---

## Teacher Endpoints

### Get Classes
```
GET /api/teacher/classes
```

**Response:**
```json
{
  "classes": [
    {
      "id": "C001",
      "schoolId": "S001",
      "name": "Kelas 4A",
      "grade": "4",
      "studentCount": 3
    }
  ]
}
```

### Create Class
```
POST /api/teacher/classes
```

**Request:**
```json
{
  "name": "Kelas 6A",
  "grade": "6",
  "schoolId": "S001"
}
```

### Get Class Detail
```
GET /api/teacher/classes/:id
```

**Response:**
```json
{
  "class": { ... },
  "students": [
    {
      "id": "ST001",
      "name": "Budi Santoso",
      "nisn": "1234567890",
      "passwordStatus": "SET",
      "stats": {
        "totalFloors": 25,
        "totalSessions": 5,
        "accuracy": 78
      }
    }
  ]
}
```

### Add Student to Class
```
POST /api/teacher/classes/:id/students
```

**Request:**
```json
{
  "nisn": "1234567899",
  "name": "Siswa Baru"
}
```

---

## Student Endpoints

### Get Materials
```
GET /api/student/materials
```

**Response:**
```json
{
  "materials": [
    {
      "id": "M001",
      "title": "Penjumlahan Dasar",
      "order": 1,
      "progress": 85
    }
  ]
}
```

---

## Practice Endpoints

### Start Practice
```
POST /api/practice/start
```

**Request:**
```json
{
  "materialId": "M001",
  "mode": "pretest"
}
```

**Response:**
```json
{
  "sessionId": "session_123...",
  "floor": 1,
  "wrongCount": 0,
  "question": {
    "id": "Q001",
    "question": "5 + 3 = ?",
    "optA": "7",
    "optB": "8",
    "optC": "9",
    "optD": "6"
  }
}
```

### Submit Answer
```
POST /api/practice/answer
```

**Request:**
```json
{
  "sessionId": "session_123...",
  "questionId": "Q001",
  "answer": "B",
  "responseMs": 5000
}
```

**Response (correct):**
```json
{
  "isCorrect": true,
  "floor": 2,
  "wrongCount": 0,
  "unlockedHints": {},
  "nextQuestion": { ... },
  "explanation": "..."
}
```

**Response (wrong):**
```json
{
  "isCorrect": false,
  "floor": 1,
  "wrongCount": 1,
  "unlockedHints": {
    "h1": "Coba hitung dengan jari"
  }
}
```

### End Practice
```
POST /api/practice/end
```

**Request:**
```json
{
  "sessionId": "session_123...",
  "reason": "user_quit",
  "stats": {
    "floorsClimbed": 5,
    "correctAnswers": 5,
    "totalAttempts": 8
  }
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_INVALID_CREDENTIALS | 401 | Wrong password |
| AUTH_USER_NOT_FOUND | 404 | User not found |
| AUTH_EMAIL_EXISTS | 409 | Email already registered |
| VALIDATION_ERROR | 400 | Invalid input |
| NOT_FOUND | 404 | Resource not found |
| SERVER_ERROR | 500 | Internal error |
