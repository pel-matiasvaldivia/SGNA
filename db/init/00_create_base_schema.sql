-- Schema público (compartido entre tenants)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(63) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    domain VARCHAR(255),
    settings JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'collaborator',
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    two_fa_enabled BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plantilla de inicialización de Schema por tenant: tenant_{slug}
-- Este schema se genera dinámicamente desde el backend, pero dejamos 
-- un comentario con la estructura para referencia:

/*
CREATE SCHEMA tenant_demo;

CREATE TABLE tenant_demo.normas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    version VARCHAR(20),
    activa BOOLEAN DEFAULT true,
    fecha_certificacion DATE,
    organismo_certificador VARCHAR(255),
    proxima_auditoria DATE,
    configuracion JSONB DEFAULT '{}'
);

CREATE TABLE tenant_demo.no_conformidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    norma_id UUID REFERENCES tenant_demo.normas(id),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('mayor','menor','potencial')),
    estado VARCHAR(30) DEFAULT 'abierta',
    origen VARCHAR(50),
    clausula_norma VARCHAR(50),
    responsable_id UUID,
    fecha_deteccion DATE DEFAULT CURRENT_DATE,
    fecha_limite_cierre DATE,
    causa_raiz TEXT,
    accion_correctiva TEXT,
    eficacia_verificada BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_demo.emisiones_carbono (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo DATE NOT NULL,
    alcance INTEGER CHECK (alcance IN (1,2,3)) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    subcategoria VARCHAR(100),
    fuente VARCHAR(255),
    cantidad DECIMAL(15,4) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    factor_emision DECIMAL(10,6),
    co2_equivalente DECIMAL(15,4),
    evidencia_documento_id UUID,
    notas TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
*/
