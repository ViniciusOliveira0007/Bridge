import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import validator from 'validator';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Tipos personalizados
interface WAFOptions {
  maxRequests?: number;
  windowMs?: number;
  enableSQLInjectionProtection?: boolean;
  enableXSSProtection?: boolean;
  blacklistedIPs?: string[];
  whitlistedIPs?: string[];
  maxFileSize?: string;
  dangerousFileExtensions?: string[];
  enableFileUploadProtection?: boolean;
  enableGeolocationBlocking?: boolean;
  blockedCountries?: string[];
  logAttacks?: boolean;
}

interface WAFError {
  error: string;
  code: string;
  ip?: string;
  timestamp?: string;
  details?: any;
}

interface AttackLog {
  type: 'SQL_INJECTION' | 'XSS' | 'RATE_LIMIT' | 'IP_BLOCKED' | 'FILE_UPLOAD' | 'SUSPICIOUS_REQUEST';
  ip: string;
  userAgent: string;
  url: string;
  method: string;
  payload?: any;
  timestamp: Date;
  blocked: boolean;
}

class SimpleWAF {
  private options: Required<WAFOptions>;
  private attackLogs: AttackLog[] = [];

  constructor(options: WAFOptions = {}) {
    this.options = {
      maxRequests: options.maxRequests || 100,
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutos
      enableSQLInjectionProtection: options.enableSQLInjectionProtection !== false,
      enableXSSProtection: options.enableXSSProtection !== false,
      enableFileUploadProtection: options.enableFileUploadProtection !== false,
      enableGeolocationBlocking: options.enableGeolocationBlocking || false,
      blacklistedIPs: options.blacklistedIPs || [],
      whitlistedIPs: options.whitlistedIPs || ['127.0.0.1', '::1'],
      maxFileSize: options.maxFileSize || '10mb',
      dangerousFileExtensions: options.dangerousFileExtensions || [
        '.exe', '.bat', '.cmd', '.scr', '.pif', '.com',
        '.js', '.jar', '.php', '.asp', '.aspx', '.jsp', '.py'
      ],
      blockedCountries: options.blockedCountries || [],
      logAttacks: options.logAttacks !== false
    };
  }

  // Log de ataques
  private logAttack(attack: Omit<AttackLog, 'timestamp'>): void {
    if (!this.options.logAttacks) return;

    const log: AttackLog = {
      ...attack,
      timestamp: new Date()
    };

    this.attackLogs.push(log);
    
    // Manter apenas os últimos 1000 logs
    if (this.attackLogs.length > 1000) {
      this.attackLogs = this.attackLogs.slice(-1000);
    }

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 WAF: ${attack.type} detectado de ${attack.ip} - ${attack.url}`);
    }
  }

  // Obter logs de ataques
  public getAttackLogs(): AttackLog[] {
    return [...this.attackLogs];
  }

  // Limpar logs
  public clearLogs(): void {
    this.attackLogs = [];
  }

  // Rate limiting
  public rateLimiter(): RequestHandler {
    return rateLimit({
      windowMs: this.options.windowMs,
      max: this.options.maxRequests,
      message: (req: Request): WAFError => ({
        error: 'Muitas requisições deste IP, tente novamente mais tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        ip: req.ip,
        timestamp: new Date().toISOString()
      }),
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response, next: NextFunction) => {
        this.logAttack({
          type: 'RATE_LIMIT',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          url: req.originalUrl,
          method: req.method,
          blocked: true
        });
        res.status(429).json({
          error: 'Muitas requisições deste IP, tente novamente mais tarde.',
          code: 'RATE_LIMIT_EXCEEDED',
          ip: req.ip,
          timestamp: new Date().toISOString()
        } as WAFError);
      }
    });
  }

  // Filtro de IP
  public ipFilter(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Verificar whitelist primeiro
      if (this.options.whitlistedIPs.length > 0) {
        const isWhitelisted = this.options.whitlistedIPs.some(ip => 
          clientIP.includes(ip) || ip === clientIP
        );
        
        if (!isWhitelisted) {
          this.logAttack({
            type: 'IP_BLOCKED',
            ip: clientIP,
            userAgent: req.get('User-Agent') || 'unknown',
            url: req.originalUrl,
            method: req.method,
            blocked: true
          });

          res.status(403).json({
            error: 'IP não autorizado',
            code: 'IP_NOT_WHITELISTED',
            ip: clientIP
          } as WAFError);
          return;
        }
      }

      // Verificar blacklist
      if (this.options.blacklistedIPs.includes(clientIP)) {
        this.logAttack({
          type: 'IP_BLOCKED',
          ip: clientIP,
          userAgent: req.get('User-Agent') || 'unknown',
          url: req.originalUrl,
          method: req.method,
          blocked: true
        });

        res.status(403).json({
          error: 'IP bloqueado',
          code: 'IP_BLACKLISTED',
          ip: clientIP
        } as WAFError);
        return;
      }

      next();
    };
  }

  // Proteção contra SQL Injection
  public sqlInjectionProtection(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!this.options.enableSQLInjectionProtection) {
        next();
        return;
      }

      const sqlPatterns: RegExp[] = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /('|(\\')|(;)|(\\;)|(--)|(\s(-){2}\s)|(\/\*)|(\*\/))/gi,
        /((\b(OR|AND)\b\s*['"]?\w*['"]?\s*=\s*['"]?\w*['"]?))/gi,
        /(UNION\s+(ALL\s+)?SELECT)/gi,
        /((LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE))/gi
      ];

      const checkForSQLInjection = (input: any): boolean => {
        if (typeof input === 'string') {
          return sqlPatterns.some(pattern => pattern.test(input));
        }
        return false;
      };

      const checkObject = (obj: any, path: string = ''): string | null => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && obj[key] !== null && obj[key] !== undefined) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              const result = checkObject(obj[key], currentPath);
              if (result) return result;
            } else {
              const value = Array.isArray(obj[key]) ? obj[key].join(' ') : obj[key].toString();
              if (checkForSQLInjection(value)) {
                return currentPath;
              }
            }
          }
        }
        return null;
      };

      // Verificar query parameters
      const queryInjection = checkObject(req.query, 'query');
      if (queryInjection) {
        this.logAttack({
          type: 'SQL_INJECTION',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          url: req.originalUrl,
          method: req.method,
          payload: { query: req.query, field: queryInjection },
          blocked: true
        });

        res.status(400).json({
          error: 'Tentativa de SQL Injection detectada',
          code: 'SQL_INJECTION_ATTEMPT',
          field: queryInjection
        } as WAFError);
        return;
      }

      // Verificar body
      if (req.body) {
        const bodyInjection = checkObject(req.body, 'body');
        if (bodyInjection) {
          this.logAttack({
            type: 'SQL_INJECTION',
            ip: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            url: req.originalUrl,
            method: req.method,
            payload: { body: req.body, field: bodyInjection },
            blocked: true
          });

          res.status(400).json({
            error: 'Tentativa de SQL Injection detectada',
            code: 'SQL_INJECTION_ATTEMPT',
            field: bodyInjection
          } as WAFError);
          return;
        }
      }

      next();
    };
  }

  // Proteção XSS
  public xssProtection(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!this.options.enableXSSProtection) {
        next();
        return;
      }

      const xssPatterns: RegExp[] = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        /vbscript:/gi,
        /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi
      ];

      const checkForXSS = (input: any): boolean => {
        if (typeof input === 'string') {
          return xssPatterns.some(pattern => pattern.test(input));
        }
        return false;
      };

      const checkObject = (obj: any, path: string = ''): string | null => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && obj[key] !== null && obj[key] !== undefined) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              const result = checkObject(obj[key], currentPath);
              if (result) return result;
            } else {
              const value = Array.isArray(obj[key]) ? obj[key].join(' ') : obj[key].toString();
              if (checkForXSS(value)) {
                return currentPath;
              }
            }
          }
        }
        return null;
      };

      // Verificar query e body
      const queryXSS = checkObject(req.query, 'query');
      const bodyXSS = req.body ? checkObject(req.body, 'body') : null;

      if (queryXSS || bodyXSS) {
        this.logAttack({
          type: 'XSS',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          url: req.originalUrl,
          method: req.method,
          payload: { query: req.query, body: req.body, field: queryXSS || bodyXSS },
          blocked: true
        });

        res.status(400).json({
          error: 'Tentativa de XSS detectada',
          code: 'XSS_ATTEMPT',
          field: queryXSS || bodyXSS
        } as WAFError);
        return;
      }

      next();
    };
  }

  // Proteção de upload de arquivos
  public fileUploadProtection(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!this.options.enableFileUploadProtection) {
        next();
        return;
      }

      const files = (req as any).files || (req as any).file;
      if (files) {
        const fileArray = Array.isArray(files) ? files : 
                         files.length ? Object.values(files).flat() : [files];

        for (const file of fileArray) {
          if (file && file.originalname) {
            const ext = file.originalname.toLowerCase()
                        .substring(file.originalname.lastIndexOf('.'));
            
            if (this.options.dangerousFileExtensions.includes(ext)) {
              this.logAttack({
                type: 'FILE_UPLOAD',
                ip: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                url: req.originalUrl,
                method: req.method,
                payload: { filename: file.originalname, extension: ext },
                blocked: true
              });

              res.status(400).json({
                error: 'Tipo de arquivo não permitido',
                code: 'DANGEROUS_FILE_TYPE',
                extension: ext
              } as WAFError);
              return;
            }
          }
        }
      }
      next();
    };
  }

  // Limitador de tamanho de requisição
  public requestSizeLimiter(maxSize: string = '10mb'): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentLength = parseInt(req.headers['content-length'] || '0');
      const maxBytes = this.parseSize(maxSize);

      if (contentLength > maxBytes) {
        this.logAttack({
          type: 'SUSPICIOUS_REQUEST',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          url: req.originalUrl,
          method: req.method,
          payload: { contentLength, maxBytes },
          blocked: true
        });

        res.status(413).json({
          error: 'Requisição muito grande',
          code: 'PAYLOAD_TOO_LARGE',
          maxSize
        } as WAFError);
        return;
      }
      next();
    };
  }

  private parseSize(size: string): number {
    const units: { [key: string]: number } = { 
      b: 1, 
      kb: 1024, 
      mb: 1024 * 1024, 
      gb: 1024 * 1024 * 1024 
    };
    
    const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/);
    return match ? parseInt(match[1]) * units[match[2]] : parseInt(size);
  }

  // Middleware principal
  public middleware(): RequestHandler[] {
    return [
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      }),
      this.ipFilter(),
      this.rateLimiter(),
      this.requestSizeLimiter(this.options.maxFileSize),
      this.sqlInjectionProtection(),
      this.xssProtection(),
      this.fileUploadProtection()
    ];
  }

  // Endpoint para visualizar logs (apenas em desenvolvimento)
  public getLogsEndpoint(): RequestHandler {
    return (req: Request, res: Response): void => {
      if (process.env.NODE_ENV === 'production') {
        res.status(404).json({ error: 'Não encontrado' });
        return;
      }

      const logs = this.getAttackLogs();
      res.json({
        total: logs.length,
        logs: logs.slice(-50), // Últimos 50 logs
        summary: {
          sqlInjection: logs.filter(l => l.type === 'SQL_INJECTION').length,
          xss: logs.filter(l => l.type === 'XSS').length,
          rateLimit: logs.filter(l => l.type === 'RATE_LIMIT').length,
          ipBlocked: logs.filter(l => l.type === 'IP_BLOCKED').length,
          fileUpload: logs.filter(l => l.type === 'FILE_UPLOAD').length,
          suspicious: logs.filter(l => l.type === 'SUSPICIOUS_REQUEST').length
        }
      });
    };
  }
}

export default SimpleWAF;
export { WAFOptions, WAFError, AttackLog };