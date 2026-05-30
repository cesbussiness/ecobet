/**
 * LocalStorage Service — Persistencia de datos
 * Guarda pacientes e informes en el navegador hasta Supabase
 */

class LocalStorage {
  constructor() {
    this.prefix = 'ecosonografia_';
  }

  // ========================================
  // PACIENTES
  // ========================================

  getPacientes() {
    const key = this.prefix + 'pacientes';
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error leyendo pacientes:', error);
      return [];
    }
  }

  addPaciente(paciente) {
    try {
      const pacientes = this.getPacientes();
      paciente.id = paciente.id || `pac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      paciente.createdAt = paciente.createdAt || new Date().toISOString();

      // Si es dependiente (menor sin cédula propia)
      if (!paciente.esAdulto && paciente.cedulaTutor) {
        console.log('👶 Paciente dependiente detectado:', paciente.nombre);
        
        // Buscar tutor por cédula
        const tutor = pacientes.find(p => p.cedula === paciente.cedulaTutor);
        if (tutor) {
          paciente.tutorId = tutor.id;
          paciente.nombreTutor = tutor.nombre;
          console.log('✅ Tutor encontrado:', tutor.nombre);
          
          // Agregar a dependientes del tutor
          if (!tutor.dependientes) tutor.dependientes = [];
          if (!tutor.dependientes.includes(paciente.id)) {
            tutor.dependientes.push(paciente.id);
            console.log('✅ Agregado a dependientes del tutor');
          }
        } else {
          console.log('⚠️ Tutor NO encontrado con cédula:', paciente.cedulaTutor);
        }
      }
      
      // Si es adulto, inicializar dependientes array
      if (paciente.esAdulto && !paciente.dependientes) {
        paciente.dependientes = [];
      }
      
      pacientes.push(paciente);
      this.savePacientes(pacientes);
      console.log('✅ Paciente guardado en localStorage:', paciente);
      console.log('📊 Total pacientes:', pacientes.length);
      return paciente;
    } catch (error) {
      console.error('❌ Error agregando paciente:', error);
      throw error;
    }
  }

  updatePaciente(id, data) {
    try {
      const pacientes = this.getPacientes();
      const idx = pacientes.findIndex(p => p.id === id);
      if (idx >= 0) {
        pacientes[idx] = { ...pacientes[idx], ...data, updatedAt: new Date().toISOString() };
        this.savePacientes(pacientes);
        console.log('✅ Paciente actualizado:', pacientes[idx]);
        return pacientes[idx];
      }
      throw new Error(`Paciente ${id} no encontrado`);
    } catch (error) {
      console.error('Error actualizando paciente:', error);
      throw error;
    }
  }

  deletePaciente(id) {
    try {
      const pacientes = this.getPacientes();
      const paciente = pacientes.find(p => p.id === id);

      // Si es dependiente, remover del tutor
      if (paciente && paciente.tutorId) {
        const tutor = pacientes.find(p => p.id === paciente.tutorId);
        if (tutor && tutor.dependientes) {
          tutor.dependientes = tutor.dependientes.filter(depId => depId !== id);
          console.log('✅ Menor removido de dependientes del tutor');
        }
      }

      // Si es tutor, advertir sobre dependientes
      if (paciente && paciente.dependientes?.length > 0) {
        console.warn(`⚠️ Este paciente tiene ${paciente.dependientes.length} dependiente(s). Considere revisar antes de eliminar.`);
      }

      const filtered = pacientes.filter(p => p.id !== id);
      this.savePacientes(filtered);
      console.log('✅ Paciente eliminado:', id);
      return true;
    } catch (error) {
      console.error('Error eliminando paciente:', error);
      throw error;
    }
  }

  // ========================================
  // PACIENTES CON DEPENDIENTES
  // ========================================

  getPacientesConDependientes() {
    // Retorna pacientes adultos con sus dependientes
    const pacientes = this.getPacientes();
    return pacientes
      .filter(p => p.esAdulto || !p.tutorId)  // Solo adultos o sin tutor
      .map(p => ({
        ...p,
        dependientes: p.dependientes ? 
          pacientes.filter(dep => p.dependientes.includes(dep.id)) : 
          []
      }));
  }

  getPacientesPorCedula(cedula) {
    // Retorna tutor y todos sus dependientes
    const pacientes = this.getPacientes();
    const tutor = pacientes.find(p => p.cedula === cedula);
    
    if (!tutor) {
      console.log('ℹ️ No se encontró paciente con cédula:', cedula);
      return null;
    }
    
    return {
      tutor: tutor,
      dependientes: tutor.dependientes ? 
        pacientes.filter(p => tutor.dependientes.includes(p.id)) : 
        [],
      total: (tutor.dependientes?.length || 0) + 1  // Tutor + dependientes
    };
  }

  getDependientes(tutorId) {
    // Retorna todos los dependientes de un tutor
    const pacientes = this.getPacientes();
    const tutor = pacientes.find(p => p.id === tutorId);
    
    if (!tutor || !tutor.dependientes) return [];
    
    return pacientes.filter(p => tutor.dependientes.includes(p.id));
  }

  savePacientes(pacientes) {
    const key = this.prefix + 'pacientes';
    localStorage.setItem(key, JSON.stringify(pacientes));
  }

  // ========================================
  // INFORMES
  // ========================================

  getInformes() {
    const key = this.prefix + 'informes';
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error leyendo informes:', error);
      return [];
    }
  }

  getInformesPorPaciente(pacienteId) {
    return this.getInformes().filter(i => i.pacienteId === pacienteId);
  }

  addInforme(informe) {
    try {
      const informes = this.getInformes();
      informe.id = informe.id || `inf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      informe.createdAt = informe.createdAt || new Date().toISOString();
      informes.push(informe);
      this.saveInformes(informes);
      console.log('✅ Informe guardado en localStorage:', informe);
      return informe;
    } catch (error) {
      console.error('Error agregando informe:', error);
      throw error;
    }
  }

  updateInforme(id, data) {
    try {
      const informes = this.getInformes();
      const idx = informes.findIndex(i => i.id === id);
      if (idx >= 0) {
        informes[idx] = { ...informes[idx], ...data, updatedAt: new Date().toISOString() };
        this.saveInformes(informes);
        console.log('✅ Informe actualizado:', informes[idx]);
        return informes[idx];
      }
      throw new Error(`Informe ${id} no encontrado`);
    } catch (error) {
      console.error('Error actualizando informe:', error);
      throw error;
    }
  }

  deleteInforme(id) {
    try {
      const informes = this.getInformes();
      const filtered = informes.filter(i => i.id !== id);
      this.saveInformes(filtered);
      console.log('✅ Informe eliminado:', id);
      return true;
    } catch (error) {
      console.error('Error eliminando informe:', error);
      throw error;
    }
  }

  saveInformes(informes) {
    const key = this.prefix + 'informes';
    localStorage.setItem(key, JSON.stringify(informes));
  }

  // ========================================
  // UTILIDADES
  // ========================================

  getStats() {
    return {
      pacientes: this.getPacientes().length,
      informes: this.getInformes().length,
      usuarioMemoria: JSON.stringify(this.getPacientes() + this.getInformes()).length
    };
  }

  clear() {
    try {
      const keys = Object.keys(localStorage)
        .filter(k => k.startsWith(this.prefix));
      keys.forEach(k => localStorage.removeItem(k));
      console.log('✅ localStorage limpiado');
    } catch (error) {
      console.error('Error limpiando storage:', error);
    }
  }

  exportData() {
    return {
      pacientes: this.getPacientes(),
      informes: this.getInformes(),
      timestamp: new Date().toISOString()
    };
  }

  importData(data) {
    try {
      if (data.pacientes) this.savePacientes(data.pacientes);
      if (data.informes) this.saveInformes(data.informes);
      console.log('✅ Datos importados correctamente');
      return true;
    } catch (error) {
      console.error('Error importando datos:', error);
      return false;
    }
  }
}

// Instancia global
const storage = new LocalStorage();
