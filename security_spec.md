# Security Specification & Payload-First TDD

This specification outlines the data invariants, security boundaries, and the "Dirty Dozen" attack payloads designed to test and break our Zero-Trust Firestore Security model.

## 1. Data Invariants & Security Boundaries

- **System Access Control**: Only authenticated users are allowed to read or write data.
- **Role-Based Permissions**: Only users with the `'Admin'` role can perform destructive or administrative operations (such as deleting certain records or modifying other users' roles).
- **Identity Integrity**: For user profiles, messages, and transactional data, the `ownerId`, `senderId`, or `userId` in the document payload must match the authenticated user's ID (`request.auth.uid`).
- **Input Validation & Sanitization**: All documents must comply with strictly bounded string sizes, correct field types, and exact key/structure constraints to prevent "Denial of Wallet" resource exhaustion or field spoofing attacks.
- **Immutability Constraints**: Critical timestamp fields (`createdAt`) and identity fields (`userId`, `ownerId`) must remain immutable after creation.
- **Temporal Integrity**: Create and update timestamps must match the exact server-provided time (`request.time`).

---

## 2. The "Dirty Dozen" Attack Payloads

These 12 payloads represent potential malicious requests intended to bypass security. Our rules are mathematically structured to block every single one of these.

### Payload 1: Shadow Update Privilege Escalation

An attacker tries to inject a `role: "Admin"` field into their standard `SystemUser` document.

```json
{
  "email": "user@isps.ac.mz",
  "role": "Admin",
  "nuit": "123456789",
  "direcao": "Finanças",
  "status": "Afetado"
}
```

_Expected Result: PERMISSION_DENIED (Users cannot self-assign the Admin role)_

### Payload 2: Ghost Field Injection (Resource Exhaustion)

An attacker attempts to write a document with an extremely large undeclared string to consume Firestore space.

```json
{
  "titulo": "Novo Livro",
  "autor": "Autor",
  "isbn": "978-3-16-148410-0",
  "exemplares": "5",
  "ghostField": "A".repeat(1024 * 1024)
}
```

_Expected Result: PERMISSION_DENIED (Strict key validation & size limits)_

### Payload 3: Identity Spoofing (Impersonation)

An attacker attempts to send a message where the `senderId` belongs to a different user.

```json
{
  "text": "Ola, tudo bem?",
  "senderId": "victim_user_id_123",
  "recipientId": "recipient_user_id_456"
}
```

_Expected Result: PERMISSION_DENIED (senderId must equal request.auth.uid)_

### Payload 4: State Shortcutting (Illegal Workflow Jump)

An attacker attempts to directly update a document process to `'Concluído'` without going through intermediate stages.

```json
{
  "tipo": "Entrada",
  "assunto": "Reclamação de Notas",
  "status": "Concluído"
}
```

_Expected Result: PERMISSION_DENIED (Status updates must match valid lifecycle progression)_

### Payload 5: Spoofed Timestamps (Client Time Abuse)

An attacker attempts to override the `createdAt` or `updatedAt` field with a future date to manipulate query order.

```json
{
  "title": "Aviso Urgente",
  "content": "Conteúdo",
  "date": "2026-06-29",
  "createdAt": "2030-01-01T00:00:00Z"
}
```

_Expected Result: PERMISSION_DENIED (Timestamps must equal request.time)_

### Payload 6: ID Poisoning / Path Traversal Attack

An attacker tries to write a document with a malicious ID consisting of path traversal characters or extremely long random strings.
_Target Path: `/users/../../etc/passwd` or `/users/junk_char_overflow_longer_than_128_bytes_...`_
_Expected Result: PERMISSION_DENIED (Document ID must match matches('^[a-zA-Z0-9\_\\-]+$'))_

### Payload 7: Relational Sync Violation (Orphaned Record Creation)

An attacker attempts to assign an `alocacoes_docentes` record with a non-existent `docenteId` or a course that is invalid.

```json
{
  "docenteId": "non_existent_docente_999",
  "curso": "Engenharia Informática"
}
```

_Expected Result: PERMISSION_DENIED (Relational lookup validates existing records)_

### Payload 8: PII Blanket Read (Data Scraping)

A standard authenticated user attempts to run a query to list all other users' personal and private details without filtering by their own user ID.
_Query: `firestore.collection('users').get()`_
_Expected Result: PERMISSION_DENIED (blanket reads strictly banned, query must filter by owner)_

### Payload 9: Terminal State Modification

An attacker attempts to modify or delete a financial report that has already been finalized and submitted.

```json
{
  "status": "Finalizado",
  "despesasPessoal": 100000
}
```

_Expected Result: PERMISSION_DENIED (Once finalized, record is immutable or admin-only)_

### Payload 10: Array Guard Overrun

An attacker attempts to inject a list containing malicious types or a massive number of elements.

```json
{
  "participants": "a,b,c".repeat(5000)
}
```

_Expected Result: PERMISSION_DENIED (Array or list size constraints exceeded)_

### Payload 11: Self-Approved Services

A visitor attempts to approve their own service request status.

```json
{
  "trackingCode": "SERV-12345",
  "visitorType": "Estudante",
  "service": "Declaração de Notas",
  "nome": "João",
  "status": "Aprovado"
}
```

_Expected Result: PERMISSION_DENIED (Only Admin can modify request status)_

### Payload 12: Invalid Numeric Values / Financial Tampering

An attacker attempts to set negative budget values or non-numeric types for financial fields.

```json
{
  "ano": "2026",
  "orcamentoAnual": -50000,
  "receitasProprias": "not_a_number"
}
```

_Expected Result: PERMISSION_DENIED (Correct numeric bounds & types required)_

---

## 3. Test Runner Design

The unit test suite inside `firestore.rules.test.ts` imports the `@firebase/rules-unit-testing` package to simulate the 12 attack vectors above, ensuring that all 12 return `permission-denied` and that correct, conforming user interactions succeed.
