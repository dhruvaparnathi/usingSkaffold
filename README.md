# Skaffold Microservices Demo

A minimal Node.js microservices setup running on Kubernetes with **Skaffold** for local development — featuring automatic hot-reload of code changes into running containers without rebuilding images.

---

## Architecture

```
                        ┌─────────────────────────────────────┐
                        │         NGINX Ingress Controller     │
                        │            (queue-ingress)           │
                        └────────────┬────────────────┬────────┘
                                     │                │
                     path: /         │                │ path: /api/notifications
                                     ▼                ▼
                          ┌──────────────┐   ┌─────────────────────┐
                          │skaffold-service│   │ notification-service │
                          │  (ClusterIP) │   │    (ClusterIP)      │
                          └──────┬───────┘   └────────┬────────────┘
                                 │                    │
                     ┌───────────▼──────┐  ┌──────────▼───────────┐
                     │  main-server     │  │  notification-server  │
                     │  (3 replicas)    │  │  (3 replicas)         │
                     │  port 3000       │  │  port 4000            │
                     └──────────────────┘  └──────────────────────┘
```

## Project Structure

```
usingSkaffold/
├── skaffold.yaml                   # Skaffold config (build + deploy + port-forward)
├── k8s/
│   ├── ingress.yml                 # NGINX Ingress routing rules
│   ├── main-deployment.yml         # Main server Deployment (3 replicas)
│   ├── main-service.yml            # Main server ClusterIP Service
│   ├── notification-deployment.yml # Notification server Deployment (3 replicas)
│   └── notification-service.yml    # Notification server ClusterIP Service
└── Backend/
    ├── main-server/                # Main Express server
    │   ├── dockerfile
    │   ├── server.js
    │   ├── nodemon.json
    │   └── package.json
    └── notifications/              # Notifications Express server
        ├── dockerfile
        ├── server.js
        └── package.json
```

## Services

| Service | Image | Internal Port | Forwarded Port | Routes |
|---|---|---|---|---|
| **main-server** | `skaffold-main-server` | 3000 | 3000 | `GET /`, `GET /api/abc` |
| **notification-server** | `notification-skaffold` | 4000 | 4000 | `GET /api/notifications`, `GET /api/abc` |

Both services are **Express 5** apps using **Morgan** for HTTP logging, running on **Node 20 Alpine**.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Kubernetes enabled
- [Skaffold](https://skaffold.dev/docs/install/) CLI
- [kubectl](https://kubernetes.io/docs/tasks/tools/) CLI
- NGINX Ingress Controller installed in your cluster

### Install NGINX Ingress (Docker Desktop)

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
```

## Getting Started

### Development (with hot-reload)

```bash
skaffold dev
```

Skaffold will:
1. Build both Docker images locally (no registry push)
2. Apply all Kubernetes manifests in `k8s/`
3. Set up port-forwarding:
   - `localhost:3000` → `skaffold-service` (main server)
   - `localhost:4000` → `notification-service` (notifications server)
4. **Watch for file changes** — any `*.js` or `*.json` change is synced directly into the running containers without a full rebuild

```bash
# Verbose output (as shown in the demo)
skaffold dev --verbosity=info
```

### One-shot Deploy

```bash
skaffold run
```

### Tear Down

```bash
skaffold delete
```

## Hot-Reload / File Sync

Skaffold uses **manual sync** — no image rebuild is triggered on save. Changed files are copied straight into `/app` inside the pods:

```yaml
sync:
  manual:
    - src: '**/*.js'
      dest: /app
    - src: '**/*.json'
      dest: /app
```

> [!NOTE]
> File sync paths are relative to each service's `context` directory, not the repo root.
> Use `**/*.js`, not `Backend/main-server/**/*.js`.

## Kubernetes Resources

| Resource | Name | Details |
|---|---|---|
| Deployment | `skaffold-deployment` | 3 replicas, 128Mi/500m limits |
| Deployment | `notification-deployment` | 3 replicas, 128Mi/500m limits |
| Service | `skaffold-service` | ClusterIP, port 80 → 3000 |
| Service | `notification-service` | ClusterIP, port 80 → 4000 |
| Ingress | `queue-ingress` | NGINX, routes by path prefix |

## API Endpoints

### Main Server (`localhost:3000`)

| Method | Path | Response |
|---|---|---|
| GET | `/` | `Hello Skaffold` |
| GET | `/api/abc` | `Skaffold` |

### Notification Server (`localhost:4000`)

| Method | Path | Response |
|---|---|---|
| GET | `/api/notifications` | `Skaffold Notifications` |
| GET | `/api/abc` | `Skaffold` |

> [!TIP]
> The Ingress also exposes `/api/notifications` on the cluster's external IP, routing it to the notification service — useful for testing inter-service routing in-cluster.

## Skaffold Config Highlights

```yaml
apiVersion: skaffold/v4beta13
kind: Config
metadata:
  name: skaffold-mern-app

build:
  local:
    push: false          # local images only, no registry
  artifacts:
    - image: skaffold-main-server
      context: ./Backend/main-server
    - image: notification-skaffold
      context: ./Backend/notifications

portForward:
  - resourceName: skaffold-service
    port: 80
    localPort: 3000
  - resourceName: notification-service
    port: 80
    localPort: 4000
```

## Tech Stack

- **Runtime**: Node.js 20 (Alpine)
- **Framework**: Express 5
- **Logging**: Morgan
- **Containers**: Docker
- **Orchestration**: Kubernetes (Docker Desktop)
- **Dev Workflow**: Skaffold v4beta13
- **Ingress**: NGINX Ingress Controller

