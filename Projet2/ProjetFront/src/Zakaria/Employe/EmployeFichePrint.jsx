import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faTimes } from '@fortawesome/free-solid-svg-icons';

const EmployeFichePrint = ({ show, onHide, employee }) => {
  const handlePrint = () => {
    const printContent = document.getElementById('employe-fiche-print');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Fiche Employé</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #fff; 
              font-size: 13px; 
              line-height: 1.4;
            }
            .no-print { display: none !important; }
            .container { max-width: 100%; margin: 0 auto; }
            
            h2 { 
              text-align: center; 
              margin: 0 0 30px; 
              color: #2c3e50; 
              font-weight: 600; 
              font-size: 22px;
              // border-bottom: 3px solid #3498db;
              padding-bottom: 10px;
            }
            
            .section { 
              margin-bottom: 25px; 
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .section-header { 
              background: linear-gradient(135deg, #3498db, #2980b9);
              color: white; 
              padding: 12px 15px; 
              margin: 0; 
              font-weight: 600; 
              font-size: 14px;
              border: none;
            }
            
            .form-table { 
              width: 100%; 
              border-collapse: collapse; 
              background: white;
            }
            
            .form-table td { 
              padding: 10px 15px; 
              border-bottom: 1px solid #f0f0f0; 
              vertical-align: middle;
            }
            
            .form-table tr:last-child td {
              border-bottom: none;
            }
            
            .form-table tr:hover {
              background-color: #f8f9fa;
            }
            
            .label { 
              font-weight: 600; 
              color: #34495e; 
              width: 200px;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .value { 
              color: #2c3e50; 
              font-weight: 500;
              min-height: 20px;
              border-bottom: 1px dotted #bdc3c7;
              padding-bottom: 5px;
            }
            
            .checkbox-group {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            
            .checkbox-item {
              display: flex;
              align-items: center;
              gap: 5px;
            }
            
            .checkbox { 
              width: 16px; 
              height: 16px; 
              border: 2px solid #3a8a90; 
              border-radius: 3px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: white;
            }
            
            .checkbox.checked { 
              background: #3a8a90; 
              color: white;
              font-weight: bold;
            }
            
            .checkbox.checked::after {
              content: '✓';
              font-size: 12px;
            }
.no-focus-outline:focus {
  outline: none !important;
  box-shadow: none !important;
}


          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 200);
    };
  };

  if (!employee) return null;

  const getDepartmentName = () => {
    if (employee.departements && employee.departements.length > 0) return employee.departements[0].nom;
    if (employee.departement) return employee.departement.nom;
    if (employee.departement_nom) return employee.departement_nom;
    return '';
  };

  const getPoste = () => {
    if (employee.fonction) return employee.fonction;
    if (employee.poste && employee.poste.nom) return employee.poste.nom;
    return '';
  };

  const isMale = String(employee.sexe || '').toLowerCase().startsWith('h') || String(employee.sexe || '').toLowerCase().startsWith('m');
  const isFemale = String(employee.sexe || '').toLowerCase().startsWith('f');

  // Styles en ligne pour le composant React (même style que l'impression)
  const containerStyle = {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    fontSize: '13px',
    lineHeight: '1.4',
    color: '#2c3e50',
    padding: '20px',
    background: '#fff'
  };

  const headerStyle = {
    textAlign: 'center',
    margin: '0 0 30px',
    color: '#2c3e50',
    fontWeight: '600',
    fontSize: '22px',
    borderBottom: '3px solid #3a8a90',
    paddingBottom: '10px',
    position: 'relative'
  };

  const sectionStyle = {
    marginBottom: '25px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const sectionHeaderStyle = {
    background: 'linear-gradient(135deg, #2c767c 0%, #3a8a90 100%)',
    color: 'white',
    padding: '12px 15px',
    margin: '0',
    fontWeight: '600',
    fontSize: '14px',
    border: 'none'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'white'
  };

  const cellStyle = {
    padding: '10px 15px',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle'
  };

  const labelStyle = {
    fontWeight: '600',
    color: '#34495e',
    width: '200px',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const valueStyle = {
    color: '#2c3e50',
    fontWeight: '500',
    minHeight: '20px',
    borderBottom: '1px dotted #bdc3c7',
    paddingBottom: '5px'
  };

  const checkboxGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  };

  const checkboxItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  };

  const checkboxStyle = {
    width: '16px',
    height: '16px',
    border: '2px solid #3a8a90',
    borderRadius: '3px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  const checkedStyle = {
    ...checkboxStyle,
    background: '#3a8a90',
    color: 'white'
  };

  const buttonGroupStyle = {
    position: 'absolute',
    top: '0',
    right: '0',
    display: 'flex',
    gap: '10px'
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered  style={{ marginTop:'2%' }}>
      <Modal.Body style={{ padding: '0'}}>
        <div id="employe-fiche-print" style={containerStyle}>
          <div style={headerStyle}>
            <h2 style={{ margin: 0 }}>Fiche Employé</h2>
            <div className="no-print" style={buttonGroupStyle}>
            <Button 
  variant="primary" 
  className="no-focus-outline" 
  onClick={handlePrint} 
  size="sm"
>
  <FontAwesomeIcon icon={faPrint} /> Imprimer
</Button>
              <Button variant="outline-secondary" onClick={onHide} size="sm">
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            </div>
          </div>

          {/* Section Informations personnelles */}
          <div style={sectionStyle}>
            <h5 style={sectionHeaderStyle}>Informations personnelles de l'employé</h5>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={{ ...cellStyle, ...labelStyle }}>Prénom :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{employee.prenom || ''}</td>
                  <td style={{ ...cellStyle, ...labelStyle }}>Nom :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{employee.nom || ''}</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, ...labelStyle }}>Adresse :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{employee.adresse || ''}</td>
                  <td style={{ ...cellStyle, ...labelStyle }}>Sexe (cocher) :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>
                    <div style={checkboxGroupStyle}>
                      <div style={checkboxItemStyle}>
                        <div style={isMale ? checkedStyle : checkboxStyle}>
                          {isMale ? '✓' : ''}
                        </div>
                        <span>Homme</span>
                      </div>
                      <div style={checkboxItemStyle}>
                        <div style={isFemale ? checkedStyle : checkboxStyle}>
                          {isFemale ? '✓' : ''}
                        </div>
                        <span>Femme</span>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, ...labelStyle }}>Ville :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{employee.ville || ''}</td>
                  <td style={{ ...cellStyle, ...labelStyle }}>Date de naissance (AAAA-MM-JJ) :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{employee.date_naiss || ''}</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, ...labelStyle }}>Province :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{employee.province || employee.pays || ''}</td>
                  <td style={{ ...cellStyle, ...labelStyle }}>N° d'assurance sociale (NAS) :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{employee.cnss || ''}</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, ...labelStyle }}>Code postal :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{employee.code_postal || ''}</td>
                  <td style={{ ...cellStyle, ...labelStyle }}>Adresse courriel :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{employee.email || ''}</td>
                </tr>
                <tr style={{ borderBottom: 'none' }}>
                  <td style={{ ...cellStyle, ...labelStyle, borderBottom: 'none' }}>N° de téléphone :</td>
                  <td style={{ ...cellStyle, ...valueStyle, borderBottom: 'none' }}>{employee.tel || ''}</td>
                  <td style={{ ...cellStyle, ...labelStyle, borderBottom: 'none' }}>N° de cellulaire :</td>
                  <td style={{ ...cellStyle, ...valueStyle, borderBottom: 'none' }}>{employee.cel || employee.mobile || employee.fax || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section Ressources humaines */}
          <div style={sectionStyle}>
            <h5 style={sectionHeaderStyle}>Informations pour les ressources humaines</h5>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={{ ...cellStyle, ...labelStyle }}>N° d'employé :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{employee.matricule || employee.id || ''}</td>
                  <td style={{ ...cellStyle, ...labelStyle }}>Poste de l'employé :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{getPoste()}</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, ...labelStyle }}>Date d'embauche (AAAA-MM-JJ) :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{employee.date_embauche || employee.date_entree || ''}</td>
                  <td style={{ ...cellStyle, ...labelStyle }}>Département :</td>
                  <td style={{ ...cellStyle, ...valueStyle }}>{getDepartmentName()}</td>
                </tr>
                <tr style={{ borderBottom: 'none' }}>
                  <td style={{ ...cellStyle, ...labelStyle, borderBottom: 'none' }}>Nom du supérieur immédiat :</td>
                  <td style={{ ...cellStyle, ...valueStyle, borderBottom: 'none' }}>{employee.superieur_nom || ''}</td>
                  <td style={{ ...cellStyle, ...labelStyle, borderBottom: 'none' }}>Poste du supérieur immédiat :</td>
                  <td style={{ ...cellStyle, ...valueStyle, borderBottom: 'none' }}>{employee.superieur_poste || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section Rémunération */}
          <div style={sectionStyle}>
            <h5 style={sectionHeaderStyle}>Rémunération et statut d'emploi</h5>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={{ ...cellStyle, ...labelStyle }}>Rémunération :</td>
                  <td style={{ ...cellStyle, ...valueStyle }} colSpan="3">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div>
                        <strong>Taux horaire :</strong>
                        <span style={{ marginLeft: '10px', borderBottom: '1px dotted #bdc3c7', minWidth: '100px', display: 'inline-block' }}>
                          {employee.taux_horaire || ''}
                        </span>
                        <span style={{ marginLeft: '5px' }}>$/h</span>
                      </div>
                      <div style={{ margin: '0 10px', fontWeight: 'bold' }}>OU</div>
                      <div>
                        <strong>Salaire annuel :</strong>
                        <span style={{ marginLeft: '10px', borderBottom: '1px dotted #bdc3c7', minWidth: '100px', display: 'inline-block' }}>
                          {employee.salaire_reference_annuel || ''}
                        </span>
                        <span style={{ marginLeft: '5px' }}>$</span>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr style={{ borderBottom: 'none' }}>
                  <td style={{ ...cellStyle, ...labelStyle, borderBottom: 'none' }}>Statut d'emploi (cocher) :</td>
                  <td style={{ ...cellStyle, ...valueStyle, borderBottom: 'none' }}>
                    <div style={checkboxGroupStyle}>
                      <div style={checkboxItemStyle}>
                        <div style={checkboxStyle}></div>
                        <span>Permanent</span>
                      </div>
                      <div style={checkboxItemStyle}>
                        <div style={checkboxStyle}></div>
                        <span>Temporaire</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...cellStyle, ...labelStyle, borderBottom: 'none' }}>Temps :</td>
                  <td style={{ ...cellStyle, ...valueStyle, borderBottom: 'none' }}>
                    <div style={checkboxGroupStyle}>
                      <div style={checkboxItemStyle}>
                        <div style={checkboxStyle}></div>
                        <span>Temps plein</span>
                      </div>
                      <div style={checkboxItemStyle}>
                        <div style={checkboxStyle}></div>
                        <span>Temps partiel</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default EmployeFichePrint;