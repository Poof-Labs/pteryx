import axios, { AxiosInstance } from "axios";

export interface ServerStatus {
  identifier: string;
  name: string;
  status: "running" | "offline" | "starting" | "stopping";
  memory_bytes: number;
  memory_limit_bytes: number;
  cpu_absolute: number;
  disk_bytes: number;
  disk_limit_bytes: number;
  network_rx_bytes: number;
  network_tx_bytes: number;
  uptime: number;
}

export interface Server {
  object: "server";
  attributes: {
    id: number;
    external_id: string | null;
    uuid: string;
    identifier: string;
    name: string;
    description: string | null;
    status: string | null;
    suspended: boolean;
    allocation: number;
  };
}

export interface Node {
  object: "node";
  attributes: {
    id: number;
    uuid: string;
    public: boolean;
    name: string;
    fqdn: string;
    scheme: string;
    memory: number;
    memory_overallocate: number;
    disk: number;
    disk_overallocate: number;
    upload_size: number;
    maintenance_mode: boolean;
    allocated_resources: {
      memory: number;
      disk: number;
    };
  };
}

export class PterodactylClient {
  private client: AxiosInstance;
  private app: AxiosInstance;

  constructor(panelUrl: string, clientKey: string, appKey: string) {
    const base = panelUrl.replace(/\/$/, "");

    this.client = axios.create({
      baseURL: `${base}/api/client`,
      headers: {
        Authorization: `Bearer ${clientKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.app = axios.create({
      baseURL: `${base}/api/application`,
      headers: {
        Authorization: `Bearer ${appKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  // - CLIENT API -

  async getServers(): Promise<Server[]> {
    const res = await this.client.get("/servers");
    return res.data.data;
  }

  async getServerResources(serverId: string): Promise<ServerStatus> {
    const res = await this.client.get(`/servers/${serverId}/resources`);
    const attrs = res.data.attributes;
    return {
      identifier: serverId,
      name: "",
      status: attrs.current_state,
      memory_bytes: attrs.resources.memory_bytes,
      memory_limit_bytes: 0,
      cpu_absolute: attrs.resources.cpu_absolute,
      disk_bytes: attrs.resources.disk_bytes,
      disk_limit_bytes: 0,
      network_rx_bytes: attrs.resources.network_rx_bytes,
      network_tx_bytes: attrs.resources.network_tx_bytes,
      uptime: attrs.resources.uptime,
    };
  }

  async powerAction(
    serverId: string,
    action: "start" | "stop" | "restart" | "kill"
  ): Promise<void> {
    await this.client.post(`/servers/${serverId}/power`, {
      signal: action,
    });
  }
  
  async sendCommand(serverId: string, command: string): Promise<void> {
    await this.client.post(`/servers/${serverId}/command`, {
      command,
    });
  }

  // - APPLICATION API -

  async getNodes(): Promise<Node[]> {
  const res = await this.app.get("/nodes");
  // Handle both { data: [...] } and bare array responses
  const raw = res.data?.data ?? res.data;
  return Array.isArray(raw) ? raw : [];
}

  async getNode(nodeId: number): Promise<Node> {
    const res = await this.app.get(`/nodes/${nodeId}`);
    return res.data;
  }

  async getAllServers(): Promise<Server[]> {
  const res = await this.app.get("/servers");
  const raw = res.data?.data ?? res.data;
  return Array.isArray(raw) ? raw : [];
}

  async suspendServer(serverId: number): Promise<void> {
    await this.app.post(`/servers/${serverId}/suspend`);
  }

  async unsuspendServer(serverId: number): Promise<void> {
    await this.app.post(`/servers/${serverId}/unsuspend`);
  }

}
