/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { AgenticFunctionsService } from './services/AgenticFunctionsService';
import { AuthenticationService } from './services/AuthenticationService';
import { AutonomousTier1Service } from './services/AutonomousTier1Service';
import { ConversationsService } from './services/ConversationsService';
import { CrmClientsService } from './services/CrmClientsService';
import { CrmInteractionsService } from './services/CrmInteractionsService';
import { CrmPracticesService } from './services/CrmPracticesService';
import { CrmSharedMemoryService } from './services/CrmSharedMemoryService';
import { DefaultService } from './services/DefaultService';
import { HandlersService } from './services/HandlersService';
import { HealthService } from './services/HealthService';
import { IdentityService } from './services/IdentityService';
import { ImageService } from './services/ImageService';
import { IngestionService } from './services/IngestionService';
import { InstagramService } from './services/InstagramService';
import { KnowledgeService } from './services/KnowledgeService';
import { MediaService } from './services/MediaService';
import { MemoryService } from './services/MemoryService';
import { NotificationsService } from './services/NotificationsService';
import { OracleIngestService } from './services/OracleIngestService';
import { OracleV53UltraHybridService } from './services/OracleV53UltraHybridService';
import { ProductivityService } from './services/ProductivityService';
import { RootService } from './services/RootService';
import { TeamActivityService } from './services/TeamActivityService';
import { WhatsappService } from './services/WhatsappService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class NuzantaraClient {
  public readonly agenticFunctions: AgenticFunctionsService;
  public readonly authentication: AuthenticationService;
  public readonly autonomousTier1: AutonomousTier1Service;
  public readonly conversations: ConversationsService;
  public readonly crmClients: CrmClientsService;
  public readonly crmInteractions: CrmInteractionsService;
  public readonly crmPractices: CrmPracticesService;
  public readonly crmSharedMemory: CrmSharedMemoryService;
  public readonly default: DefaultService;
  public readonly handlers: HandlersService;
  public readonly health: HealthService;
  public readonly identity: IdentityService;
  public readonly image: ImageService;
  public readonly ingestion: IngestionService;
  public readonly instagram: InstagramService;
  public readonly knowledge: KnowledgeService;
  public readonly media: MediaService;
  public readonly memory: MemoryService;
  public readonly notifications: NotificationsService;
  public readonly oracleIngest: OracleIngestService;
  public readonly oracleV53UltraHybrid: OracleV53UltraHybridService;
  public readonly productivity: ProductivityService;
  public readonly root: RootService;
  public readonly teamActivity: TeamActivityService;
  public readonly whatsapp: WhatsappService;
  public readonly request: BaseHttpRequest;
  constructor(
    config?: Partial<OpenAPIConfig>,
    HttpRequest: HttpRequestConstructor = FetchHttpRequest
  ) {
    this.request = new HttpRequest({
      BASE: config?.BASE ?? '',
      VERSION: config?.VERSION ?? '0.1.0',
      WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
      CREDENTIALS: config?.CREDENTIALS ?? 'include',
      TOKEN: config?.TOKEN,
      USERNAME: config?.USERNAME,
      PASSWORD: config?.PASSWORD,
      HEADERS: config?.HEADERS,
      ENCODE_PATH: config?.ENCODE_PATH,
    });
    this.agenticFunctions = new AgenticFunctionsService(this.request);
    this.authentication = new AuthenticationService(this.request);
    this.autonomousTier1 = new AutonomousTier1Service(this.request);
    this.conversations = new ConversationsService(this.request);
    this.crmClients = new CrmClientsService(this.request);
    this.crmInteractions = new CrmInteractionsService(this.request);
    this.crmPractices = new CrmPracticesService(this.request);
    this.crmSharedMemory = new CrmSharedMemoryService(this.request);
    this.default = new DefaultService(this.request);
    this.handlers = new HandlersService(this.request);
    this.health = new HealthService(this.request);
    this.identity = new IdentityService(this.request);
    this.image = new ImageService(this.request);
    this.ingestion = new IngestionService(this.request);
    this.instagram = new InstagramService(this.request);
    this.knowledge = new KnowledgeService(this.request);
    this.media = new MediaService(this.request);
    this.memory = new MemoryService(this.request);
    this.notifications = new NotificationsService(this.request);
    this.oracleIngest = new OracleIngestService(this.request);
    this.oracleV53UltraHybrid = new OracleV53UltraHybridService(this.request);
    this.productivity = new ProductivityService(this.request);
    this.root = new RootService(this.request);
    this.teamActivity = new TeamActivityService(this.request);
    this.whatsapp = new WhatsappService(this.request);
  }
}
