import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Download, Upload, Search, File, FileText } from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { fetchAllCounters, updateMachineCounter } from '@/store/slices/counterSlice';
import { fetchMachines } from '@/store/slices/machinesSlice';
import { fetchClients } from '@/store/slices/clientsSlice';
import { toast } from '@/components/ui/use-toast';
import { CounterSelector } from '@/components/CounterSelector';
import { SignaturePad } from '@/components/SignatureCanvas';
import { generateUniqueId } from '@/lib/utils';

// Mock data for collections
const mockCollections = [
  { id: 'R001', date: '2023-06-01', client: 'Bar El Rincón', machines: 3, amount: 320, technician: 'Carlos Gómez' },
  { id: 'R002', date: '2023-06-02', client: 'Cafetería Central', machines: 2, amount: 280, technician: 'María López' },
  { id: 'R003', date: '2023-06-05', client: 'Restaurante Los Amigos', machines: 1, amount: 150, technician: 'Carlos Gómez' },
  { id: 'R004', date: '2023-06-07', client: 'Pub La Noche', machines: 4, amount: 410, technician: 'María López' },
  { id: 'R005', date: '2023-06-10', client: 'Cafetería Aroma', machines: 2, amount: 210, technician: 'Carlos Gómez' },
];

const CollectionsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [collections, setCollections] = useState(mockCollections);
  const [searchTerm, setSearchTerm] = useState('');
  const { machines } = useSelector((state: RootState) => state.machines);
  const { clients } = useSelector((state: RootState) => state.clients);
  
  // Estado para el diálogo de nueva recaudación
  const [isNewCollectionDialogOpen, setIsNewCollectionDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [newCollectionFormData, setNewCollectionFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    previousCounter: '',
    currentCounter: '',
    technician: '',
    notes: '',
    signatureData: ''
  });

  useEffect(() => {
    dispatch(fetchMachines());
    dispatch(fetchClients());
    dispatch(fetchAllCounters());
  }, [dispatch]);

  const filteredCollections = collections.filter(collection => 
    collection.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Obtener las máquinas instaladas (con cliente asignado)
  const installedMachines = machines.filter(machine => machine.status === 'installed' && machine.clientId);

  // Cuando se selecciona una máquina, actualizar automáticamente el cliente
  useEffect(() => {
    if (selectedMachine) {
      const machine = machines.find(m => m.id === selectedMachine);
      if (machine && machine.clientId) {
        const clientId = parseInt(machine.clientId);
        setSelectedClient(clientId);
        
        // También actualizar el contador previo
        setNewCollectionFormData(prev => ({
          ...prev,
          previousCounter: machine.currentCounter.toString()
        }));
      }
    }
  }, [selectedMachine, machines]);

  const handleNewCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMachine || !selectedClient) {
      toast({
        title: "Error",
        description: "Por favor selecciona una máquina y un cliente.",
        variant: "destructive",
      });
      return;
    }

    if (!newCollectionFormData.currentCounter || !newCollectionFormData.amount || !newCollectionFormData.technician) {
      toast({
        title: "Error",
        description: "Todos los campos obligatorios deben ser completados.",
        variant: "destructive",
      });
      return;
    }

    if (!newCollectionFormData.signatureData) {
      toast({
        title: "Error",
        description: "Se requiere la firma digital para completar la recaudación.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentCounter = parseInt(newCollectionFormData.currentCounter);
      const previousCounter = parseInt(newCollectionFormData.previousCounter);
      
      if (currentCounter < previousCounter) {
        toast({
          title: "Error",
          description: "El contador actual no puede ser menor que el contador anterior.",
          variant: "destructive",
        });
        return;
      }
      
      // Actualizar el contador en el sistema de contadores
      await dispatch(updateMachineCounter({
        machineId: selectedMachine,
        newCounter: currentCounter,
        source: 'collection',
        notes: `Recaudación: ${newCollectionFormData.amount}€`
      }));

      // Crear nueva recaudación (en un sistema real, esto se guardaría en la base de datos)
      const newCollection = {
        id: `R${generateUniqueId().substring(0, 6)}`,
        date: newCollectionFormData.date,
        client: clients.find(c => c.id === selectedClient)?.name || 'Cliente desconocido',
        machines: 1,
        amount: parseFloat(newCollectionFormData.amount),
        technician: newCollectionFormData.technician
      };

      // Actualizar la lista de recaudaciones (simulado)
      setCollections([newCollection, ...collections]);

      // Store the signature (in a real system, this would be saved to the database)
      console.log("Signature data stored:", {
        machineId: selectedMachine,
        clientId: selectedClient,
        type: 'collection',
        date: newCollectionFormData.date,
        signatureData: newCollectionFormData.signatureData
      });

      toast({
        title: "¡Recaudación registrada!",
        description: "La recaudación ha sido registrada exitosamente.",
        duration: 3000,
      });

      setIsNewCollectionDialogOpen(false);
      resetCollectionForm();
    } catch (error) {
      console.error('Error al registrar la recaudación:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar la recaudación. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const resetCollectionForm = () => {
    setSelectedMachine(null);
    setSelectedClient(null);
    setNewCollectionFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      previousCounter: '',
      currentCounter: '',
      technician: '',
      notes: '',
      signatureData: ''
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recaudaciones</h1>
          <p className="text-muted-foreground">Gestiona los registros de recaudación de tus máquinas.</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="space-x-2">
          <Dialog open={isNewCollectionDialogOpen} onOpenChange={setIsNewCollectionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="mr-2 h-4 w-4" /> Nueva Recaudación
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Recaudación</DialogTitle>
                <DialogDescription>
                  Ingresa los datos de la recaudación realizada.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleNewCollectionSubmit} className="space-y-4 py-4">
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="date">Fecha</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={newCollectionFormData.date}
                    onChange={(e) => setNewCollectionFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="machine">Máquina</Label>
                  <select 
                    id="machine"
                    value={selectedMachine || ''}
                    onChange={(e) => setSelectedMachine(e.target.value || null)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Seleccionar máquina</option>
                    {installedMachines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.serialNumber} - {machine.model} ({machine.brand})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid w-full gap-1.5">
                  <Label htmlFor="client">Cliente</Label>
                  <select 
                    id="client"
                    value={selectedClient || ''}
                    onChange={(e) => setSelectedClient(e.target.value ? parseInt(e.target.value) : null)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                    disabled={selectedMachine !== null} // Deshabilitar si ya se seleccionó una máquina
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {selectedMachine && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cliente asignado automáticamente según la máquina seleccionada
                    </p>
                  )}
                </div>

                {/* Contador anterior (solo lectura) */}
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="previousCounter">Contador Anterior</Label>
                  <Input 
                    id="previousCounter" 
                    type="number"
                    value={newCollectionFormData.previousCounter}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                {/* Contador actual con el componente CounterSelector */}
                <CounterSelector
                  machineId={selectedMachine}
                  value={newCollectionFormData.currentCounter}
                  onChange={(value) => setNewCollectionFormData(prev => ({ ...prev, currentCounter: value }))}
                  label="Contador Actual"
                  required={true}
                />

                <div className="grid w-full gap-1.5">
                  <Label htmlFor="amount">Importe Total (€)</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00"
                    value={newCollectionFormData.amount}
                    onChange={(e) => setNewCollectionFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid w-full gap-1.5">
                  <Label htmlFor="technician">Técnico</Label>
                  <Input 
                    id="technician" 
                    placeholder="Nombre del técnico que realiza la recaudación"
                    value={newCollectionFormData.technician}
                    onChange={(e) => setNewCollectionFormData(prev => ({ ...prev, technician: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid w-full gap-1.5">
                  <Label htmlFor="notes">Notas</Label>
                  <textarea 
                    id="notes"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Observaciones adicionales"
                    value={newCollectionFormData.notes}
                    onChange={(e) => setNewCollectionFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                {/* Componente de firma digital */}
                <SignaturePad
                  value={newCollectionFormData.signatureData}
                  onChange={(value) => setNewCollectionFormData(prev => ({ ...prev, signatureData: value }))}
                  label="Firma Digital del Responsable"
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsNewCollectionDialogOpen(false);
                      resetCollectionForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" variant="default">Guardar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-x-2">
          <Button variant="violet">
            <FileText className="mr-2 h-4 w-4" /> Generar Informe
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
          placeholder="Buscar por cliente, técnico o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle>Registro de Recaudaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="text-sm text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-center">Máquinas</th>
                  <th className="px-4 py-3 text-right">Importe</th>
                  <th className="px-4 py-3 text-left">Técnico</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollections.map((collection) => (
                  <tr key={collection.id} className="border-b border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <File className="h-4 w-4 mr-2 text-muted-foreground" />
                        {collection.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatDate(collection.date)}</td>
                    <td className="px-4 py-3 font-medium">{collection.client}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        {collection.machines}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(collection.amount)}</td>
                    <td className="px-4 py-3">{collection.technician}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="violet" size="sm">Editar</Button>
                        <Button variant="default" size="sm">Detalle</Button>
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
  );
};

export default CollectionsPage;
