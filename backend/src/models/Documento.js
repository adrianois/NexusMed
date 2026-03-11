/**
 * Model Sequelize para documentos médicos gerados durante o atendimento.
 * Compatível com o padrão já adotado em Assinatura.js.
 */
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TIPOS_VALIDOS = [
  'atestado',
  'relatorio',
  'receita_simples',
  'receita_antimicrobiano',
  'receita_controle_especial',
  'solicitacao_exames',
  'laudo',
  'parecer_tecnico',
];

const Documento = sequelize.define('Documento', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  tipo: {
    type: DataTypes.ENUM(...TIPOS_VALIDOS),
    allowNull: false,
  },

  consultaId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK para a tabela consultas',
  },

  medicoId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK para usuarios (role = medico)',
  },

  dados: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Payload específico de cada tipo de documento',
  },

  status: {
    type: DataTypes.ENUM('pendente_assinatura', 'assinado', 'cancelado'),
    defaultValue: 'pendente_assinatura',
    allowNull: false,
  },

  arquivoPdf: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Caminho relativo do PDF gerado em /uploads/documentos/',
  },

  arquivoAssinado: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Caminho do arquivo .p7s após assinatura GOV.BR',
  },

  hashDocumento: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'SHA-256 em hex do PDF gerado (para validação de integridade)',
  },
}, {
  tableName: 'documentos_medicos',
  timestamps: true,   // createdAt e updatedAt automáticos
});

export default Documento;
export { TIPOS_VALIDOS };
