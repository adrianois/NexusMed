import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Assinatura = sequelize.define('Assinatura', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tipoDocumento: {
    type: DataTypes.ENUM(
      'atestado',
      'relatorio',
      'receita_simples',
      'receita_antimicrobiano',
      'receita_controle_especial',
      'solicitacao_exames',
      'laudo',
      'parecer_tecnico'
    ),
    allowNull: false,
  },
  documentoId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  medicoId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pendente', 'assinado', 'erro'),
    defaultValue: 'pendente',
    allowNull: false,
  },
  arquivoP7s: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Caminho do arquivo PKCS#7 (.p7s) gerado pela API GOV.BR',
  },
  dataAssinatura: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  hashDocumento: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'SHA-256 em base64 do PDF assinado',
  },
}, {
  tableName: 'assinaturas',
  timestamps: true,
});

export default Assinatura;
