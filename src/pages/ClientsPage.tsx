import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Download, Upload, FileText, Search, CheckCircle2 } from 'lucide-react';
import { getStatusConfig } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { RootState, AppDispatch } from '@/store';
import { fetchClients, addClient, updateClient, deleteClient } from '@/store/slices/clientsSlice';
import { Client } from '@/lib/db';

// Datos de ejemplo para clientes
const mockClients: Client[] = [
  { 
    id: 1, 
    name: 'Bar El Rincón', 
    businessType: 'Bar',
    owner: 'Juan Pérez García',
    address: 'Calle Principal 123', 
    city: 'Madrid',
    province: 'Madrid',
    postalCode: '28001',
    phone: '555-1234', 
    email: 'contacto@elrincon.com',
    taxId: 'B12345678',
    morningOpenTime: '10:00',
    morningCloseTime: '16:00',
    eveningOpenTime: '18:00',
    eveningCloseTime: '02:00',
    closingDay: 'Lunes',
    machines: 3, 
    notes: 'Local con alta rotación de clientes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 2, 
    name: 'Cafetería Central', 
    businessType: 'Cafetería',
    owner: 'María García López',
    address: 'Av. Libertad 456', 
    city: 'Barcelona',
    province: 'Barcelona',
    postalCode: '08001',
    phone: '555-5678',
    email: '',
    taxId: 'B87654321',
    morningOpenTime: '08:00',
    morningCloseTime: '16:00',
    eveningOpenTime: '',
    eveningCloseTime: '20:00',
    closingDay: 'Domingo',
    machines: 2,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 3, 
    name: 'Restaurante Los Amigos', 
    businessType: 'Restaurante',
    owner: 'Carlos Ruiz Martínez',
    address: 'Plaza Mayor 789', 
    city: 'Valencia',
    province: 'Valencia',
    postalCode: '46001',
    phone: '555-9012',
    email: 'info@losamigos.com',
    taxId: 'B98765432',
    morningOpenTime: '12:00',
    morningCloseTime: '16:00',
    eveningOpenTime: '19:00',
    eveningCloseTime: '00:00',
    closingDay: 'Martes',
    machines: 1,
    notes: 'Especialidad en arroces',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const ClientsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { clients, status, error } = useSelector((state: RootState) => state.clients);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    businessType: '',
    owner: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
    email: '',
    taxId: '',
    morningOpenTime: '',
    morningCloseTime: '',
    eveningOpenTime: '',
    eveningCloseTime: '',
    closingDay: '',
    notes: ''
  });
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obligatorios
    if (!formData.morningOpenTime) {
      toast({
        title: "Error",
        description: "Debe especificar la hora de apertura.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.eveningCloseTime) {
      toast({
        title: "Error",
        description: "Debe especificar la hora de cierre.",
        variant: "destructive",
      });
      return;
    }

    // Si especifica uno de los campos de horario partido, debe especificar ambos
    if ((formData.morningCloseTime && !formData.eveningOpenTime) || 
        (!formData.morningCloseTime && formData.eveningOpenTime)) {
      toast({
        title: "Error",
        description: "Si especifica horario partido, debe indicar tanto el cierre de mañana como la apertura de tarde.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingClient) {
        // Actualizar cliente existente
        await dispatch(updateClient({
          ...formData,
          id: editingClient.id,
          machines: editingClient.machines
        })).unwrap();
        toast({
          title: "¡Cliente actualizado!",
          description: `${formData.name} ha sido actualizado exitosamente.`,
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          duration: 3000,
        });
      } else {
        // Crear nuevo cliente
        await dispatch(addClient({
          ...formData,
          machines: 0
        })).unwrap();
        toast({
          title: "¡Cliente guardado!",
          description: `${formData.name} ha sido añadido exitosamente.`,
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          duration: 3000,
        });
      }

      // Cerrar el diálogo y limpiar el estado
      setOpen(false);
      setEditingClient(null);
      
      // Limpiar el formulario
      setFormData({
        name: '',
        businessType: '',
        owner: '',
        address: '',
        city: '',
        province: '',
        postalCode: '',
        phone: '',
        email: '',
        taxId: '',
        morningOpenTime: '',
        morningCloseTime: '',
        eveningOpenTime: '',
        eveningCloseTime: '',
        closingDay: '',
        notes: ''
      });

      // Recargar los clientes
      dispatch(fetchClients());
    } catch (error) {
      console.error('Error al guardar el cliente:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        await dispatch(deleteClient(id)).unwrap();
        dispatch(fetchClients());
        toast({
          title: "Cliente eliminado",
          description: "El cliente ha sido eliminado exitosamente.",
          duration: 3000,
        });
      } catch (error) {
        console.error('Error al eliminar el cliente:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el cliente. Por favor, intente nuevamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      businessType: client.businessType,
      owner: client.owner,
      address: client.address,
      city: client.city,
      province: client.province,
      postalCode: client.postalCode,
      phone: client.phone,
      email: client.email,
      taxId: client.taxId,
      morningOpenTime: client.morningOpenTime,
      morningCloseTime: client.morningCloseTime || '',
      eveningOpenTime: client.eveningOpenTime || '',
      eveningCloseTime: client.eveningCloseTime,
      closingDay: client.closingDay,
      notes: client.notes || ''
    });
    setOpen(true);
  };

  const formatSchedule = (client: any) => {
    if (client.morningOpenTime && client.eveningCloseTime && !client.morningCloseTime && !client.eveningOpenTime) {
      // Horario continuo
      return `${client.morningOpenTime}-${client.eveningCloseTime}`;
    } else if (client.morningOpenTime && client.morningCloseTime) {
      // Horario partido
      let schedule = `${client.morningOpenTime}-${client.morningCloseTime}`;
      if (client.eveningOpenTime && client.eveningCloseTime) {
        schedule += ` y ${client.eveningOpenTime}-${client.eveningCloseTime}`;
      }
      return schedule;
    }
    return '';
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gestiona tus clientes y locales.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="space-x-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingClient ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</DialogTitle>
                  <DialogDescription>
                    {editingClient 
                      ? 'Modifica los datos del cliente existente.'
                      : 'Ingresa los datos del nuevo cliente. Los campos marcados con * son obligatorios.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Local *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nombre del local o negocio"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Tipo de Negocio *</Label>
                      <select
                        id="businessType"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">Seleccionar tipo</option>
                        <option value="Bar">Bar</option>
                        <option value="Restaurante">Restaurante</option>
                        <option value="Cafetería">Cafetería</option>
                        <option value="Pub">Pub</option>
                        <option value="Salón de Juegos">Salón de Juegos</option>
                        <option value="Centro Recreativo">Centro Recreativo</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="owner">Nombre y Apellidos del Propietario *</Label>
                      <Input
                        id="owner"
                        name="owner"
                        value={formData.owner}
                        onChange={handleChange}
                        placeholder="Nombre y apellidos completos"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">NIF/CIF *</Label>
                      <Input
                        id="taxId"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleChange}
                        placeholder="Identificación fiscal"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Dirección completa"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Ciudad"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Provincia *</Label>
                      <Input
                        id="province"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        placeholder="Provincia"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Código Postal *</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="Código postal"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Número de contacto"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="morningOpenTime">Apertura Mañana *</Label>
                        <select
                          id="morningOpenTime"
                          name="morningOpenTime"
                          value={formData.morningOpenTime}
                          onChange={handleChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="">Seleccionar hora</option>
                          <option value="07:00">07:00</option>
                          <option value="08:00">08:00</option>
                          <option value="09:00">09:00</option>
                          <option value="10:00">10:00</option>
                          <option value="11:00">11:00</option>
                          <option value="12:00">12:00</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="morningCloseTime">Cierre Mañana</Label>
                        <select
                          id="morningCloseTime"
                          name="morningCloseTime"
                          value={formData.morningCloseTime}
                          onChange={handleChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Seleccionar hora</option>
                          <option value="13:00">13:00</option>
                          <option value="14:00">14:00</option>
                          <option value="15:00">15:00</option>
                          <option value="16:00">16:00</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="eveningOpenTime">Apertura Tarde</Label>
                        <select
                          id="eveningOpenTime"
                          name="eveningOpenTime"
                          value={formData.eveningOpenTime}
                          onChange={handleChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Seleccionar hora</option>
                          <option value="16:00">16:00</option>
                          <option value="17:00">17:00</option>
                          <option value="18:00">18:00</option>
                          <option value="19:00">19:00</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eveningCloseTime">Cierre Tarde</Label>
                        <select
                          id="eveningCloseTime"
                          name="eveningCloseTime"
                          value={formData.eveningCloseTime}
                          onChange={handleChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Seleccionar hora</option>
                          <option value="20:00">20:00</option>
                          <option value="21:00">21:00</option>
                          <option value="22:00">22:00</option>
                          <option value="23:00">23:00</option>
                          <option value="00:00">00:00</option>
                          <option value="01:00">01:00</option>
                          <option value="02:00">02:00</option>
                          <option value="03:00">03:00</option>
                          <option value="04:00">04:00</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closingDay">Día de Cierre *</Label>
                    <select
                      id="closingDay"
                      name="closingDay"
                      value={formData.closingDay}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Seleccionar día</option>
                      <option value="Lunes">Lunes</option>
                      <option value="Martes">Martes</option>
                      <option value="Miércoles">Miércoles</option>
                      <option value="Jueves">Jueves</option>
                      <option value="Viernes">Viernes</option>
                      <option value="Sábado">Sábado</option>
                      <option value="Domingo">Domingo</option>
                      <option value="Ninguno">Ninguno</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas Adicionales</Label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Observaciones importantes sobre el cliente"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" type="button">Cancelar</Button>
                    <Button variant="default" type="submit">Guardar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-x-2">
            <Button variant="violet">
              <FileText className="mr-2 h-4 w-4" /> Plantilla
            </Button>
            <Button variant="violet">
              <Upload className="mr-2 h-4 w-4" /> Importar
            </Button>
            <Button variant="violet">
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, dirección o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle>Listado de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="text-sm text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Propietario</th>
                    <th className="px-4 py-3 text-left">Teléfono</th>
                    <th className="px-4 py-3 text-left">Ciudad</th>
                    <th className="px-4 py-3 text-center">Máquinas</th>
                    <th className="px-4 py-3 text-left">Horario</th>
                    <th className="px-4 py-3 text-left">Cierre</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="w-8 h-8 flex items-center justify-center bg-[#ccff00] text-black text-sm font-medium rounded">
                            {client.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{client.name}</td>
                      <td className="px-4 py-3">{client.owner}</td>
                      <td className="px-4 py-3">{client.phone}</td>
                      <td className="px-4 py-3">{client.city}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                          {client.machines}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatSchedule(client)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                          {client.closingDay}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="violet" size="sm" onClick={() => handleEdit(client)}>
                            Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(client.id)}>
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  );
};

export default ClientsPage;
