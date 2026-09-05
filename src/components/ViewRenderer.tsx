import React, { Suspense, lazy } from "react";
import SplashScreen from "../blocos/bloco1_apresentacao/SplashScreen";
import LoginScreen from "../blocos/bloco1_apresentacao/LoginScreen";
import MainMenu from "../blocos/bloco1_apresentacao/MainMenu";
import MainContent from "../blocos/bloco1_apresentacao/MainContent";
import Footer from "../blocos/bloco1_apresentacao/Footer";
import SubMenu from "../blocos/bloco1_apresentacao/SubMenu";
import MainHeader from "../blocos/bloco1_apresentacao/MainHeader";
import { MatrixActivity, Event, Nota, ServiceRequest, BookRegistration } from "../types";
import { firestoreService } from "../lib/firestoreService";
import { ErrorBoundary } from "./ErrorBoundary";
import EventBlock from "../blocos/bloco8_gerais/EventBlock";
import { RefreshCw, X, Loader2 } from "lucide-react";
import { isSuperBossUser, getUserWorkspace } from "../lib/auth";

// Lazy loading heavy views
const SistemaView = lazy(() => import("../blocos/bloco5_sistema/SistemaView"));
const DirectorDashboard = lazy(() => import("../blocos/bloco2_orgaos_gestao/DirectorDashboard"));
const ReposicaoTesteView = lazy(() => import("../blocos/bloco3_unidades_organicas/ReposicaoTesteView"));
const WorkflowRequisicaoView = lazy(() => import("../blocos/bloco5_sistema/WorkflowRequisicaoView"));
const MatrixView = lazy(() => import("../blocos/bloco5_sistema/MatrixView"));
const ArchiveView = lazy(() => import("../blocos/bloco5_sistema/ArchiveView"));
const BalancoMensalView = lazy(() => import("../blocos/bloco4_servicos_centrais/BalancoMensalView"));
const EventDetailView = lazy(() => import("../blocos/bloco8_gerais/EventDetailView"));
const NoteDetailView = lazy(() => import("../blocos/bloco5_sistema/NoteDetailView"));
const NotaDoDiaForm = lazy(() => import("../blocos/bloco6_documentos/NotaDoDiaForm"));
const AgendarNovoEncontroView = lazy(() => import("../blocos/bloco5_sistema/AgendarNovoEncontroView"));
const VisitorWelcomeView = lazy(() => import("../blocos/bloco4_servicos_centrais/VisitorWelcomeView"));
const VisitorServicesView = lazy(() => import("../blocos/bloco4_servicos_centrais/VisitorServicesView"));
const ServiceRequestForm = lazy(() => import("../blocos/bloco5_sistema/ServiceRequestForm"));
const TrackingView = lazy(() => import("../blocos/bloco5_sistema/TrackingView"));
const GestaoDocumentosView = lazy(() => import("../blocos/bloco4_servicos_centrais/GestaoDocumentosView"));
const MonitoriaView = lazy(() => import("../blocos/bloco5_sistema/MonitoriaView"));
const GestaoPessoalView = lazy(() => import("../blocos/bloco4_servicos_centrais/GestaoPessoalView"));
const UGEA_SupplierManagementView = lazy(() => import("../blocos/bloco4_servicos_centrais/UGEA_SupplierManagementView"));
const UGEA_SupplierRegistrationForm = lazy(() => import("../blocos/bloco4_servicos_centrais/UGEA_SupplierRegistrationForm"));
const UGEA_PlanView = lazy(() => import("../blocos/bloco4_servicos_centrais/UGEA_PlanView"));
const GestaoProdutosPrecosView = lazy(() => import("../blocos/bloco9_produtos_precos/GestaoProdutosPrecosView"));
const MonografiaView = lazy(() => import("../blocos/bloco3_unidades_organicas/MonografiaView"));
const GestaoPatrimonialView = lazy(() => import("../blocos/bloco4_servicos_centrais/GestaoPatrimonialView"));
const DocumentosView = lazy(() => import("../blocos/bloco6_documentos/DocumentosView"));
const ReportsView = lazy(() => import("../blocos/bloco7_relatorios/ReportsView"));
const AssinaturaDigitalView = lazy(() => import("../blocos/bloco5_sistema/AssinaturaDigitalView"));
const EconomatoView = lazy(() => import("../blocos/bloco4_servicos_centrais/EconomatoView"));
const SystemRegistrationForm = lazy(() => import("../blocos/bloco5_sistema/SystemRegistrationForm"));
const LibraryVisitForm = lazy(() => import("../blocos/bloco3_unidades_organicas/LibraryVisitForm"));
const AcaoOrcamentalView = lazy(() => import("./AcaoOrcamentalView"));
const PlanoWorkflowView = lazy(() => import("../blocos/bloco5_sistema/PlanoWorkflowView"));
const CalendarView = lazy(() => import("../blocos/bloco5_sistema/CalendarView"));
const GestaoExpedienteHistoricoView = lazy(() => import("../blocos/bloco4_servicos_centrais/GestaoExpedienteHistoricoView"));
const LibraryManagementView = lazy(() => import("../blocos/bloco3_unidades_organicas/LibraryManagementView"));
const SectorSelectionView = lazy(() => import("../blocos/bloco1_apresentacao/SectorSelectionView").then(m => ({ default: m.SectorSelectionView })));

const ViewLoading = () => (
  <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50/50 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-blue-900" size={40} />
      <p className="text-blue-900 font-black text-xs tracking-widest animate-pulse">CARREGANDO MÓDULO...</p>
    </div>
  </div>
);

const WorkspaceRedirect: React.FC<{
  workspace: string;
  onSetView?: (view: any) => void;
  setDashboardTitle?: (title: string) => void;
}> = ({ workspace, onSetView, setDashboardTitle }) => {
  React.useEffect(() => {
    if (setDashboardTitle) setDashboardTitle(workspace);
    if (onSetView) onSetView("dashboard");
  }, [workspace, onSetView, setDashboardTitle]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="animate-spin text-blue-900" size={32} />
        <p className="text-blue-900 font-black text-xs tracking-widest">Redirecionando para o Painel...</p>
      </div>
    </div>
  );
};

interface ViewRendererProps {
  view: string;
  user: any;
  extendedUser: any;
  dashboardTitle: string;
  dashboardItems?: any[];
  processos?: any[];
  colaboradores?: any[];
  events?: any[];
  expedientes?: any[];
  libraryRegistrations?: any[];
  bookRegistrations?: any[];
  notes?: any[];
  goBack: () => void;
  onLogout: () => void;
  onNavigate?: (title: string, items: any[]) => void;
  onUpdateEvent?: (id: string, data: any) => Promise<any>;
  onDeleteEvent?: (id: string) => Promise<any>;
  onDeleteExpediente?: (id: string) => Promise<any>;
  onDeleteBook?: (id: string) => Promise<any>;
  onDeleteNote?: (id: string) => Promise<any>;
  onUpdateUser?: (id: string, data: any) => Promise<any>;
  onLogin?: (user: any) => void;
  initStatus?: string;
  bootComplete?: boolean;
  onBootComplete?: () => void;
  onSetView?: (view: any) => void;
  onGlobalSync?: () => void;
  isSyncing?: boolean;
  visitorType?: string;
  onSetVisitorType?: (type: string) => void;
  verifiedVisitor?: any;
  onSetVerifiedVisitor?: (v: any) => void;
  selectedService?: string;
  onSetSelectedService?: (s: string) => void;
  serviceRequests?: any[];
  suppliers?: any[];
  matrixActivities?: any[];
  onShowAlert?: (msg: string, type?: string) => void;
  currentSubMenu?: any;
  openSubMenu?: (title: string, items: any[]) => void;
  dashboardActiveItem?: any;
  setInnerPath?: (path: string[]) => void;
  setDashboardTitle?: (title: string) => void;
  financialData?: any;
  setFinancialData?: (data: any) => void;
  activities?: any[];
  onSelectSector?: (sector: string) => void;
}

export const ViewRenderer: React.FC<ViewRendererProps> = (props) => {
  if (!props.bootComplete) {
    return (
      <SplashScreen
        user={props.extendedUser}
        isFirstLogin={false}
        onFinish={props.onBootComplete || (() => {})}
        initStatus={props.initStatus}
      />
    );
  }

  return (
    <Suspense fallback={<ViewLoading />}>
      <ViewRendererInner {...props} />
    </Suspense>
  );
};


const ViewRendererInner: React.FC<ViewRendererProps> = ({
  view,
  user,
  extendedUser,
  dashboardTitle,
  dashboardItems = [],
  processos = [],
  colaboradores = [],
  events = [],
  expedientes = [],
  libraryRegistrations = [],
  bookRegistrations = [],
  notes = [],
  goBack,
  onLogout,
  onNavigate = (_title?: string, _items?: any[]) => {},
  onUpdateEvent = async (_id?: string, _data?: any) => {},
  onDeleteEvent = async (_id?: string) => {},
  onDeleteExpediente = async (_id?: string) => {},
  onDeleteBook = async (_id?: string) => {},
  onDeleteNote = async (_id?: string) => {},
  onUpdateUser = async (_id?: string, _data?: any) => {},
  onLogin = (_user?: any) => {},
  onSetView = (_v?: any) => {},
  onGlobalSync = () => {},
  isSyncing = false,
  visitorType = "",
  onSetVisitorType = (_type?: string) => {},
  verifiedVisitor = null,
  onSetVerifiedVisitor = (_v?: any) => {},
  selectedService = "",
  onSetSelectedService = (_s?: string) => {},
  serviceRequests = [],
  suppliers = [],
  matrixActivities = [],
  onShowAlert = (_msg?: string, _type?: string) => {},
  currentSubMenu = null,
  openSubMenu = (_title?: string, _items?: any[]) => {},
  dashboardActiveItem = undefined,
  setInnerPath = (_path?: string[]) => {},
  setDashboardTitle = (_title?: string) => {},
  financialData = [],
  setFinancialData = (_data?: any) => {},
  activities = [],
  onSelectSector,
}) => {
  if (view === "home") {
    return (
      <>
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/d/1Xasp7NB08GDtIE2VEwf-O5iycCdDJKg1"
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80"></div>
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full text-white">
          <header className="flex flex-col sm:flex-row justify-between items-start p-6 md:p-12 flex-none gap-8">
            <div className="flex flex-col gap-4 w-full sm:w-1/2">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-amber-500 font-black text-[13px] tracking-widest bg-slate-950/80 border border-slate-800 w-fit px-4 py-1.5 rounded-xl shadow-lg backdrop-blur-sm">
                  Eventos Marcados
                </h3>
                <button
                  onClick={onGlobalSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl border border-emerald-400/30 transition-all shadow-lg backdrop-blur-sm disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? "Sincronizando..." : "Sincronizar Tudo"}
                </button>
              </div>
              <EventBlock events={events} onEventClick={() => onSetView("event_detail")} />
            </div>

            <div className="flex flex-col gap-4 w-full sm:w-1/2 md:items-end">
              <div className="mb-2">
                <h3 className="text-amber-500 font-black text-[13px] tracking-widest bg-slate-950/80 border border-slate-800 w-fit px-4 py-1.5 rounded-xl shadow-lg backdrop-blur-sm">
                  Nota do dia:
                </h3>
              </div>
              <button
                onClick={() => onSetView("note_detail")}
                className="w-full sm:w-80 bg-slate-950/80 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md text-left hover:bg-slate-900/90 transition-all group relative overflow-hidden"
              >
                <p className="text-slate-100 text-lg leading-relaxed line-clamp-4 font-medium italic">
                  "
                  {notes
                    ?.filter((n) => {
                      if (!n?.date) return false;
                      const noteDate = new Date(n.date);
                      if (isNaN(noteDate.getTime())) return false;
                      noteDate.setHours(0, 0, 0, 0);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return noteDate > today;
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.content || "Nenhuma nota ativa no momento."}
                  "
                </p>
              </button>
            </div>
          </header>
          <main className="flex-grow flex flex-col items-center justify-center sm:justify-start sm:pt-0 sm:-mt-40">
            <MainContent
              onStart={() => {
                if (user && user.role !== "Utilizador") {
                  const isAdmin = isSuperBossUser(extendedUser || user);
                  const isTecnico = (extendedUser?.cargo || "").toLowerCase().includes("tecnico") || 
                                   (extendedUser?.cargo || "").toLowerCase().includes("técnico");
                  if (isAdmin) {
                    if (onSetView) onSetView("menu");
                  } else if (isTecnico) {
                    if (onSetView) onSetView("sector_selection");
                  } else {
                    const workspace = getUserWorkspace(extendedUser || user);
                    if (workspace) {
                      if (setDashboardTitle) setDashboardTitle(workspace);
                      if (onSetView) onSetView("dashboard");
                    } else {
                      if (onSetView) onSetView("menu");
                    }
                  }
                } else {
                  if (onSetView) onSetView("login");
                }
              }}
              onVisitante={() => onSetView("visitor_welcome")}
              onSigpro={() => window.open("https://sigpro.ispsongo.ac.mz", "_blank", "noopener,noreferrer")}
              onMonografia={() => onSetView("monografia")}
              user={user && user.role !== "Utilizador" ? extendedUser : null}
            />

            <div className="w-full max-w-2xl mt-auto space-y-1 mb-2">
              <div
                className="w-full h-1 bg-white/10 rounded-full overflow-hidden"
                style={{ boxShadow: "1px 1px 0 #000, 2px 2px 0 #000, 3px 3px 0 #000" }}
              >
                <div className="h-full bg-gradient-to-r from-blue-600 via-purple-500 via-orange-500 via-green-500 to-blue-600 w-full animate-[gradient-x_3s_linear_infinite] bg-[length:200%_auto]"></div>
              </div>
              <p
                className="text-amber-500 text-[10px] text-center tracking-[0.6em] font-black font-sans"
                style={{ textShadow: "1px 1px 0 #000, 2px 2px 0 #000, 3px 3px 0 #000, 4px 4px 4px rgba(0,0,0,0.5)" }}
              >
                Instituto Superior Politécnico de Songo
              </p>
            </div>
          </main>
          <Footer className="flex-none" />
        </div>
      </>
    );
  }

  if (!user && view !== "login" && view !== "registration_form" && view !== "visitor_welcome" && view !== "visitor_services" && view !== "library_visit" && view !== "monografia") {
    return <LoginScreen onClose={goBack} onLogin={onLogin} onRegisterClick={() => onSetView("registration_form")} events={events} />;
  }

  switch (view) {
    case "login":
      if (user && user.role !== "Utilizador") {
        const isAdmin = isSuperBossUser(extendedUser || user);
        const isTecnico = (extendedUser?.cargo || "").toLowerCase().includes("tecnico") || 
                         (extendedUser?.cargo || "").toLowerCase().includes("técnico");
        if (isAdmin) {
          return <MainMenu user={extendedUser} onNavigate={openSubMenu} onShowAlert={onShowAlert} onBack={goBack} onLogout={onLogout} />;
        } else if (isTecnico) {
          return (
            <SectorSelectionView
              user={extendedUser || user}
              sectors={extendedUser?.setoresAtribuidos || user?.setoresAtribuidos || []}
              onSelectSector={(sector) => {
                if (onSelectSector) {
                  onSelectSector(sector);
                } else {
                  if (setDashboardTitle) setDashboardTitle(sector);
                  if (onSetView) onSetView("dashboard");
                }
              }}
              onBack={goBack}
            />
          );
        } else {
          const workspace = getUserWorkspace(extendedUser || user);
          if (workspace) {
            return (
              <WorkspaceRedirect
                workspace={workspace}
                onSetView={onSetView}
                setDashboardTitle={setDashboardTitle}
              />
            );
          } else {
            return <MainMenu user={extendedUser} onNavigate={openSubMenu} onShowAlert={onShowAlert} onBack={goBack} onLogout={onLogout} />;
          }
        }
      }
      return <LoginScreen onClose={goBack} onLogin={onLogin} onRegisterClick={() => onSetView("registration_form")} events={events} />;

    case "sector_selection":
      return (
        <SectorSelectionView
          user={extendedUser || user}
          sectors={extendedUser?.setoresAtribuidos || user?.setoresAtribuidos || []}
          onSelectSector={(sector) => {
            if (onSelectSector) {
              onSelectSector(sector);
            } else {
              if (setDashboardTitle) setDashboardTitle(sector);
              if (onSetView) onSetView("dashboard");
            }
          }}
          onBack={goBack}
        />
      );

    case "menu":
      if (extendedUser && !isSuperBossUser(extendedUser)) {
        const isTecnico = (extendedUser.cargo || "").toLowerCase().includes("tecnico") || 
                         (extendedUser.cargo || "").toLowerCase().includes("técnico");
        
        if (
          isTecnico ||
          (extendedUser.setoresAtribuidos &&
          Array.isArray(extendedUser.setoresAtribuidos) &&
          extendedUser.setoresAtribuidos.length > 1)
        ) {
          return (
            <SectorSelectionView
              user={extendedUser}
              sectors={extendedUser.setoresAtribuidos || []}
              onSelectSector={(sector) => {
                if (onSelectSector) {
                  onSelectSector(sector);
                } else {
                  if (setDashboardTitle) setDashboardTitle(sector);
                  if (onSetView) onSetView("dashboard");
                }
              }}
              onBack={goBack}
            />
          );
        }
        const workspace = getUserWorkspace(extendedUser);
        if (workspace) {
          return (
            <WorkspaceRedirect
              workspace={workspace}
              onSetView={onSetView}
              setDashboardTitle={setDashboardTitle}
            />
          );
        }
      }
      return <MainMenu user={extendedUser} onNavigate={openSubMenu} onShowAlert={onShowAlert} onBack={goBack} onLogout={onLogout} />;

    case "submenu":
      return currentSubMenu ? (
        <SubMenu
          title={currentSubMenu.title}
          items={currentSubMenu.items}
          onBack={goBack}
          onNavigate={openSubMenu}
          onShowAlert={onShowAlert}
          onLibrarySubmit={(reg) => firestoreService.libraryVisits.add(reg)}
          onBookSubmit={(book) => firestoreService.libraryBooks.add(book)}
          onLogout={onLogout}
          bookRegistrations={bookRegistrations}
          events={events}
          onAddEvent={(e) => firestoreService.events.add(e)}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
          onAgendar={() => onSetView("agendar")}
          onNota={() => onSetView("nota_form")}
          onPlanoSetorial={() => onSetView("plano_workflow")}
          onRelatorioAnual={() => onSetView("relatorios")}
          onTetoOrcamental={() => onSetView("acao_orcamental")}
          notes={notes}
          matrixActivities={matrixActivities}
          user={extendedUser}
        />
      ) : (
        <MainMenu user={extendedUser} onNavigate={openSubMenu} onShowAlert={onShowAlert} onBack={goBack} onLogout={onLogout} />
      );

    case "dashboard":
      if (dashboardTitle === "Reposição de Teste") {
        return <ReposicaoTesteView onBack={goBack} user={extendedUser || user} />;
      }
      if (dashboardTitle === "Sistema") {
        return (
          <SistemaView
            onBack={goBack}
            onLogout={onLogout}
            events={events}
            expedientes={expedientes}
            libraryRegistrations={libraryRegistrations}
            bookRegistrations={bookRegistrations}
            notes={notes}
            onDeleteEvent={onDeleteEvent}
            onDeleteExpediente={onDeleteExpediente}
            onDeleteBook={onDeleteBook}
            onDeleteNote={onDeleteNote}
            onUpdateEvent={onUpdateEvent}
            user={extendedUser || user}
            colaboradores={colaboradores}
            onShowAlert={onShowAlert}
          />
        );
      }
      return (
        <DirectorDashboard
          title={dashboardTitle}
          onBack={goBack}
          events={events}
          onDeleteEvent={onDeleteEvent}
          onUpdateEvent={onUpdateEvent}
          expedientes={expedientes}
          onDeleteExpediente={onDeleteExpediente}
          onUpdateExpediente={async (id, data) => firestoreService.expedientes.update(id, data)}
          libraryRegistrations={libraryRegistrations}
          onDeleteBook={onDeleteBook}
          bookRegistrations={bookRegistrations}
          notes={notes}
          onDeleteNote={onDeleteNote}
          user={extendedUser || user}
          colaboradores={colaboradores}
          onShowAlert={onShowAlert}
          initialActiveItem={dashboardActiveItem}
          financialData={financialData}
          setFinancialData={setFinancialData}
          onLogout={onLogout}
          onAgendar={() => onSetView("agendar")}
          onNota={() => onSetView("nota_form")}
          onGestaoDocumentos={() => onSetView("gestao_documentos")}
          activities={activities}
          onDeleteActivity={async (id) => {
            const act = activities.find((a) => a.id === id);
            await firestoreService.actividades.delete(id);
            if (act) {
              await firestoreService.resequenceActivitiesAfterDelete("actividades", act, activities);
            }
          }}
          matrixActivities={matrixActivities}
          onDeleteMatrixActivity={async (id) => {
            const act = matrixActivities.find((a) => a.id === id);
            await firestoreService.matrixActivities.delete(id);
            if (act) {
              await firestoreService.resequenceActivitiesAfterDelete("matrix_activities", act, matrixActivities);
            }
          }}
          onUpdateMatrixActivity={(id, data) => firestoreService.matrixActivities.update(id, data)}
          suppliers={suppliers}
          processos={processos}
          onPathChange={setInnerPath}
          setDashboardTitle={setDashboardTitle}
        />
      );

    case "event_detail":
      return <EventDetailView events={events} onBack={goBack} />;

    case "note_detail":
      return <NoteDetailView onBack={goBack} notes={notes} />;

    case "nota_form":
      return (
        <NotaDoDiaForm
          onBack={goBack}
          onSubmit={async (note) => {
            await firestoreService.notes.add(note);
            onSetView("home");
          }}
        />
      );

    case "agendar":
      return (
        <AgendarNovoEncontroView
          onBack={goBack}
          onSchedule={async (event) => {
            await firestoreService.events.add(event);
            onSetView("home");
          }}
        />
      );

    case "visitor_welcome":
      return (
        <VisitorWelcomeView
          onBack={() => onSetView("home")}
          onSelectType={(type, verifiedData) => {
            onSetVisitorType(type);
            onSetVerifiedVisitor(verifiedData || null);
            onSetView("visitor_services");
          }}
        />
      );

    case "visitor_services":
      return (
        <VisitorServicesView
          visitorType={visitorType}
          onBack={() => onSetView("visitor_welcome")}
          onSelectService={(service) => {
            if (service === "Biblioteca") {
              onSetView("library_visit");
            } else if (service === "Rastrear Pedido") {
              onSetView("tracking");
            } else {
              onSetSelectedService(service);
              onSetView("service_request");
            }
          }}
        />
      );

    case "service_request":
      return (
        <ServiceRequestForm
          visitorType={visitorType}
          service={selectedService}
          onBack={() => onSetView("visitor_services")}
          onSubmit={async (req) => {
            await firestoreService.serviceRequests.add(req);
          }}
          user={user || verifiedVisitor}
        />
      );

    case "tracking":
      return <TrackingView onBack={() => onSetView("home")} serviceRequests={serviceRequests} />;

    case "gestao_documentos":
      return (
        <GestaoDocumentosView
          onBack={goBack}
          expedientes={expedientes}
          onUpdateExpediente={async (updated) => {
            await firestoreService.expedientes.update(updated.id, updated);
          }}
          onTrackingClick={() => onSetView("tracking")}
          title={dashboardTitle || "Secretaria Geral"}
          user={extendedUser}
          onLogout={onLogout}
        />
      );

    case "monitoria":
      return <MonitoriaView onBack={goBack} activities={activities} user={extendedUser} onLogout={onLogout} />;

    case "colaboradores":
      return (
        <ErrorBoundary>
          <GestaoPessoalView
            onBack={goBack}
            title={dashboardTitle}
            user={extendedUser}
            onLogout={onLogout}
            initialColaboradores={colaboradores}
            initialProcessos={processos}
          />
        </ErrorBoundary>
      );

    case "supplier_management":
    case "suppliers":
      return (
        <UGEA_SupplierManagementView
          onBack={goBack}
          onAddSupplier={() => (onSetView ? onSetView("supplier_form") : undefined)}
          suppliers={suppliers || []}
          onShowAlert={onShowAlert}
        />
      );

    case "supplier_form":
    case "ugea_supplier_form":
      return (
        <UGEA_SupplierRegistrationForm
          onBack={() => (onSetView ? onSetView("supplier_management") : goBack())}
          onSubmit={async (s) => {
            await firestoreService.suppliers.add(s);
            if (onShowAlert) {
              onShowAlert("Fornecedor registado com sucesso!", "success");
            }
            if (onSetView) {
              onSetView("supplier_management");
            } else {
              goBack();
            }
          }}
        />
      );

    case "plano_aquisicao":
      return <UGEA_PlanView type="Aquisicão" activities={matrixActivities} user={extendedUser || user} onBack={goBack} />;

    case "plano_contratacao":
      return <UGEA_PlanView type="Contratação" activities={matrixActivities} user={extendedUser || user} onBack={goBack} />;

    case "produtos_precos":
      return <GestaoProdutosPrecosView />;

    case "monografia":
      return (
        <MonografiaView
          onBack={goBack}
          title="Monografia SIGEP Songo"
          systemData={{
            eventsCount: events.length,
            expedientesCount: expedientes.length,
            libraryCount: libraryRegistrations.length,
            booksCount: bookRegistrations.length,
            colaboradoresCount: colaboradores.length,
            alocacoesCount: 0,
            version: "2.5.0-stable",
          }}
        />
      );

    case "gestao_patrimonial":
      return <GestaoPatrimonialView onBack={goBack} user={extendedUser} />;

    case "documentos_normativos":
      return (
        <div className="flex flex-col h-full bg-slate-950">
          <MainHeader
            user={extendedUser}
            onBack={goBack}
            showBack={true}
            title="Documentos Normativos"
            onLogout={onLogout}
          />
          <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-900 text-slate-100">
            <DocumentosView title="Documentos Normativos" user={extendedUser} />
          </div>
        </div>
      );

    case "relatorios":
      return (
        <div className="flex flex-col h-full bg-slate-50">
          <div className="flex-1 overflow-auto">
            <ReportsView user={extendedUser} onShowAlert={onShowAlert} initialDirection="Geral" onBack={goBack} />
          </div>
        </div>
      );

    case "assinatura_digital":
      return <AssinaturaDigitalView onBack={goBack} user={extendedUser} />;

    case "economato":
      return <EconomatoView onBack={goBack} user={extendedUser} />;

    case "registration_form":
      return (
        <div className="fixed inset-0 bg-white z-[120] overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <div>
                <h1 className="text-3xl font-bold text-[#0a0a5a] font-serif tracking-tight">Formulário de registo</h1>
                <p className="text-gray-500 italic font-serif">Página de acesso independente</p>
              </div>
              <button onClick={() => onSetView("login")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <SystemRegistrationForm
              currentUser={extendedUser}
              onCancel={() => onSetView("login")}
              onSubmit={() => {
                alert("Registo submetido com sucesso! Irá receber as suas credenciais no e-mail.");
                onSetView("login");
              }}
            />
          </div>
        </div>
      );

    case "library_visit":
      return (
        <LibraryVisitForm
          onBack={() => onSetView("home")}
          onSubmit={async (reg) => {
            await firestoreService.libraryVisits.add(reg);
            onSetView("home");
          }}
          initialTipoVisitante={visitorType}
          bookRegistrations={bookRegistrations}
          user={user || verifiedVisitor}
        />
      );

    case "requisicoes":
      return (
        <WorkflowRequisicaoView
          onBack={goBack}
          user={extendedUser}
          onNew={() => {
            // Internal state in WorkflowRequisicaoView handles this
          }}
        />
      );

    case "matrix":
      return (
        <MatrixView
          title={dashboardTitle || "Matriz de Actividades"}
          isDepartment={false}
          externalActivities={events as any}
          onUpdateActivity={onUpdateEvent}
          onDeleteActivity={onDeleteEvent}
          user={extendedUser}
        />
      );

    case "archive":
      return <ArchiveView user={extendedUser} onBack={goBack} onShowAlert={onShowAlert} />;

    case "balanco":
      return <BalancoMensalView movements={[]} user={extendedUser} onBack={goBack} />;

    case "acao_orcamental":
      return (
        <div className="w-full h-full overflow-y-auto scrollbar bg-slate-50 p-2 md:p-6">
          <AcaoOrcamentalView
            user={extendedUser}
            title={dashboardTitle || currentSubMenu?.title || "Teto Orçamental"}
            activities={matrixActivities}
            onShowAlert={onShowAlert}
            onBack={goBack}
          />
        </div>
      );

    case "plano_workflow":
      return (
        <PlanoWorkflowView
          user={extendedUser}
          title={dashboardTitle || "Plano Setorial"}
          matrixActivities={matrixActivities}
          colaboradores={colaboradores}
          onAddMatrixActivity={(data: any) => firestoreService.matrixActivities.add(data)}
          onUpdateMatrixActivity={(id: string, data: any) => firestoreService.matrixActivities.update(id, data)}
          onShowAlert={onShowAlert}
          onBack={goBack}
        />
      );

    case "calendar":
      return (
        <div className="flex flex-col h-full bg-slate-950">
          <MainHeader
            user={extendedUser}
            onBack={goBack}
            showBack={true}
            title={dashboardTitle || "Calendário de Actividades"}
            onLogout={onLogout}
          />
          <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 bg-slate-900">
            <CalendarView
              events={events}
              onAddEvent={(evt) => firestoreService.events.add(evt)}
              onUpdateEvent={onUpdateEvent}
              onDeleteEvent={onDeleteEvent}
              onAgendar={() => onSetView("agendar")}
              onNota={() => onSetView("nota_form")}
              title={dashboardTitle || "Calendário de Actividades"}
              notes={notes}
              user={extendedUser}
            />
          </div>
        </div>
      );

    case "expediente":
    case "processos":
      return (
        <GestaoExpedienteHistoricoView
          onBack={goBack}
          expedientes={expedientes}
          onUpdateExpediente={(updated: any) => firestoreService.expedientes.update(updated.id, updated)}
          user={extendedUser}
          title={dashboardTitle || "Gestão de Expedientes"}
          initialTab="Histórico de Documentos"
          activities={matrixActivities}
          onNavigate={(item) => onSetView(item)}
        />
      );

    case "efetivo":
    case "alocacoes":
      return (
        <GestaoPessoalView
          onBack={goBack}
          title={dashboardTitle || "Gestão de Pessoal"}
          user={extendedUser}
          onLogout={onLogout}
          initialColaboradores={colaboradores}
          initialProcessos={processos}
        />
      );

    case "service_requests":
      return <TrackingView onBack={goBack} serviceRequests={[]} />;

    case "financial":
      return (
        <div className="w-full h-full overflow-y-auto scrollbar bg-slate-50 p-2 md:p-6">
          <AcaoOrcamentalView
            user={extendedUser}
            title={dashboardTitle || "Recursos Financeiros"}
            activities={matrixActivities}
            onShowAlert={onShowAlert}
            onBack={goBack}
          />
        </div>
      );

    case "library_management":
      return (
        <LibraryManagementView
          registrations={libraryRegistrations}
          bookRegistrations={bookRegistrations}
        />
      );



    default:
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
          <div className="p-6 bg-white rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
            <h2 className="text-2xl font-black text-blue-900 mb-2 tracking-tight">Página não encontrada</h2>
            <p className="text-gray-500 font-medium mb-6">A vista selecionada ("{view}") não está disponível.</p>
            <button
              onClick={goBack}
              className="w-full py-4 bg-blue-900 text-white rounded-2xl font-black tracking-widest hover:bg-blue-800 transition-all shadow-lg"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      );
  }
};

