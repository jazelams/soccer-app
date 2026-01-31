# Documento de Diseño Técnico - Sistema de Gestión de Torneos de Fútbol

## 1. Introducción
Este documento describe la arquitectura y diseño técnico para el sistema de administración financiera de una liga de fútbol con 6 torneos semanales independientes.

## 2. Pila Tecnológica
- **Backend**: Node.js con Express (TypeScript).
- **Base de Datos**: PostgreSQL.
- **ORM**: Prisma IO.
- **Frontend**: Next.js (Existente).
- **Autenticación**: JWT (JSON Web Tokens) + BCrypt.
- **Validación**: Zod o Joi.

## 3. Arquitectura del Sistema
Se utilizará una arquitectura en capas (Layered Architecture) para garantizar la separación de responsabilidades y facilitar el mantenimiento ("Clean Architecture" pragmática).

```
src/
├── config/         # Configuraciones (DB, Env vars)
├── controllers/    # Manejo de peticiones HTTP
├── services/       # Lógica de negocio pura
├── repositories/   # Acceso a datos (Prisma Abstraction)
├── routes/         # Definición de rutas API
├── middlewares/    # Auth, Validación, Logging
├── utils/          # Helpers
└── app.ts          # Punto de entrada
```

## 4. Modelado de Datos (Schema Prisma)

El siguiente esquema garantiza la separación estricta por torneo y maneja las finanzas detalladas.

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  TREASURER     // Tesorero
  TEAM_REPRESENTATIVE // Representante de equipo
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
}

enum PaymentMethod {
  CASH
  TRANSFER
}

enum PaymentStatus {
  PENDING
  PARTIAL
  PAID
}

model Tournament {
  id        Int       @id @default(autoincrement())
  name      String    // Ej: "Torneo Lunes"
  day       DayOfWeek @unique // Un torneo por día específico
  startDate DateTime  @default(now()) // Para calcular fechas de jornadas
  teams     Team[]
  expenses  Expense[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Team {
  id              Int        @id @default(autoincrement())
  name            String
  tournamentId    Int
  tournament      Tournament @relation(fields: [tournamentId], references: [id])
  
  // Conceptos Financieros Base
  registrationFee Decimal    @default(0) // Costo Inscripción
  arbitrationFee  Decimal    @default(0) // Costo Arbitraje Total (o base)
  
  // Descuentos aplicados al monto total
  discountAmount  Decimal    @default(0) 
  
  // Relaciones
  payments        Payment[]
  users           User[]     // Usuarios asignados a este equipo
  
  active          Boolean    @default(true)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([tournamentId])
}

model Payment {
  id              Int           @id @default(autoincrement())
  teamId          Int
  team            Team          @relation(fields: [teamId], references: [id])
  
  amount          Decimal
  method          PaymentMethod
  
  // Datos de Transferencia
  transferRef     String?       // Folio
  transferDate    DateTime?     // Fecha de transferencia
  
  // Relación con Jornada (Opcional, para desglose)
  matchday        Int?          // 1 a 10
  
  recordedAt      DateTime      @default(now()) // Timestamp del servidor
  
  notes           String?
  
  @@index([teamId])
}

model Expense {
  id            Int         @id @default(autoincrement())
  tournamentId  Int
  tournament    Tournament  @relation(fields: [tournamentId], references: [id])
  
  description   String
  amount        Decimal
  date          DateTime    @default(now())
  
  @@index([tournamentId])
}

model User {
  id            Int      @id @default(autoincrement())
  username      String   @unique
  password      String   // Hashed
  role          Role
  
  // Si es usuario de equipo
  teamId        Int?
  team          Team?    @relation(fields: [teamId], references: [id])
  
  createdAt     DateTime @default(now())
}
```

## 5. Lógica de "Estado de Cuenta"

El reporte de estado de cuenta se generará calculando dinámicamente:

**Total a Pagar (Deuda)**:
`Total = (Team.registrationFee + Team.arbitrationFee) - Team.discountAmount`

**Total Pagado**:
`Sum(Team.payments.amount)`

**Saldo Pendiente**:
`Balance = Total a Pagar - Total Pagado`

**Desglose**:
Se listarán las 10 jornadas teóricas. Se cruzarán los pagos que tengan `matchday` asignado. Los pagos sin jornada específica se mostrarán como "Abonos Generales".

## 6. Seguridad

1.  **Backend Protegido**: Middleware de autenticación global.
2.  **Roles**: Middleware `authorize(Role[])` para restringir endpoints.
    *   `GET /api/teams/:id/statement` -> Accesible por ADMIN, TREASURER, y el Usuario del TEAM correspondiente.
3.  **Inyección SQL**: Prisma previene esto nativamente.
4.  **Validación**: Inputs sanitizados con Zod en cada controller.

## 7. API Endpoints Clave

- `POST /api/auth/login`
- `GET /api/tournaments`
- `POST /api/tournaments/:id/teams`
- `POST /api/payments` (Registrar pago con validación de método)
- `GET /api/teams/:id/statement` (Generar JSON del Estado de Cuenta)

## 8. Siguientes Pasos
1.  Inicializar Backend.
2.  Configurar Prisma y Docker (si es necesario) o conexión remota.
3.  Implementar CRUD básico.
4.  Implementar Lógica Financiera.
