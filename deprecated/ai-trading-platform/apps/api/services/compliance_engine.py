"""
Compliance Engine - Advanced compliance monitoring and regulatory reporting
"""

import asyncio
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

import pandas as pd
import numpy as np
from loguru import logger
from config.settings import get_settings

settings = get_settings()


class ComplianceLevel(Enum):
    """Compliance severity levels"""
    INFO = "info"
    WARNING = "warning"
    VIOLATION = "violation"
    CRITICAL = "critical"


class RegulatoryFramework(Enum):
    """Supported regulatory frameworks"""
    SEC = "sec"  # Securities and Exchange Commission
    FINRA = "finra"  # Financial Industry Regulatory Authority
    CFTC = "cftc"  # Commodity Futures Trading Commission
    MiFID_II = "mifid_ii"  # Markets in Financial Instruments Directive II
    GDPR = "gdpr"  # General Data Protection Regulation
    SOX = "sox"  # Sarbanes-Oxley Act
    BASEL_III = "basel_iii"  # Basel III banking regulations


@dataclass
class ComplianceRule:
    """Compliance rule definition"""
    rule_id: str
    name: str
    description: str
    framework: RegulatoryFramework
    severity: ComplianceLevel
    enabled: bool = True
    parameters: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.parameters is None:
            self.parameters = {}


@dataclass
class ComplianceViolation:
    """Compliance violation record"""
    violation_id: str
    rule_id: str
    severity: ComplianceLevel
    title: str
    description: str
    entity_type: str  # user, bot, trade, position
    entity_id: str
    data: Dict[str, Any]
    timestamp: datetime
    resolved: bool = False
    resolution_notes: Optional[str] = None
    
    def __post_init__(self):
        if self.violation_id is None:
            self.violation_id = str(uuid.uuid4())


@dataclass
class AuditEvent:
    """Audit event record"""
    event_id: str
    event_type: str
    user_id: str
    tenant_id: str
    entity_type: str
    entity_id: str
    action: str
    old_values: Dict[str, Any]
    new_values: Dict[str, Any]
    timestamp: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    def __post_init__(self):
        if self.event_id is None:
            self.event_id = str(uuid.uuid4())


class ComplianceEngine:
    """Advanced compliance monitoring and regulatory reporting engine"""
    
    def __init__(self):
        self.rules: Dict[str, ComplianceRule] = {}
        self.violations: List[ComplianceViolation] = []
        self.audit_events: List[AuditEvent] = []
        
        # Monitoring tasks
        self.monitoring_task: Optional[asyncio.Task] = None
        self.reporting_task: Optional[asyncio.Task] = None
        
        # Configuration
        self.monitoring_interval = 60  # seconds
        self.max_violations_memory = 10000
        self.max_audit_events_memory = 50000
        
        self.ready = False
    
    async def initialize(self):
        """Initialize compliance engine"""
        logger.info("⚖️ Initializing Compliance Engine...")
        
        try:
            # Load compliance rules
            await self._load_compliance_rules()
            
            # Start monitoring tasks
            self.monitoring_task = asyncio.create_task(self._compliance_monitoring_loop())
            self.reporting_task = asyncio.create_task(self._regulatory_reporting_loop())
            
            self.ready = True
            logger.info("✅ Compliance Engine initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize compliance engine: {e}")
            self.ready = False
    
    def is_ready(self) -> bool:
        """Check if compliance engine is ready"""
        return self.ready
    
    async def _load_compliance_rules(self):
        """Load compliance rules for different regulatory frameworks"""
        
        # SEC Rules
        self.rules["sec_pattern_day_trader"] = ComplianceRule(
            rule_id="sec_pattern_day_trader",
            name="Pattern Day Trader Rule",
            description="Monitor for pattern day trading violations (4+ day trades in 5 business days)",
            framework=RegulatoryFramework.SEC,
            severity=ComplianceLevel.VIOLATION,
            parameters={
                "day_trade_threshold": 4,
                "business_days_period": 5,
                "minimum_equity": 25000
            }
        )
        
        self.rules["sec_insider_trading"] = ComplianceRule(
            rule_id="sec_insider_trading",
            name="Insider Trading Monitoring",
            description="Monitor for potential insider trading patterns",
            framework=RegulatoryFramework.SEC,
            severity=ComplianceLevel.CRITICAL,
            parameters={
                "unusual_volume_threshold": 5.0,  # 5x average volume
                "price_movement_threshold": 0.1,  # 10% price movement
                "time_window_hours": 24
            }
        )
        
        # FINRA Rules
        self.rules["finra_know_your_customer"] = ComplianceRule(
            rule_id="finra_know_your_customer",
            name="Know Your Customer (KYC)",
            description="Ensure proper customer identification and verification",
            framework=RegulatoryFramework.FINRA,
            severity=ComplianceLevel.VIOLATION,
            parameters={
                "required_documents": ["id", "address_proof", "income_verification"],
                "verification_expiry_days": 365
            }
        )
        
        self.rules["finra_anti_money_laundering"] = ComplianceRule(
            rule_id="finra_anti_money_laundering",
            name="Anti-Money Laundering (AML)",
            description="Monitor for suspicious transaction patterns",
            framework=RegulatoryFramework.FINRA,
            severity=ComplianceLevel.CRITICAL,
            parameters={
                "large_transaction_threshold": 10000,
                "rapid_transaction_count": 10,
                "rapid_transaction_window_hours": 1,
                "structuring_threshold": 9000
            }
        )
        
        # Risk Management Rules
        self.rules["risk_position_limit"] = ComplianceRule(
            rule_id="risk_position_limit",
            name="Position Size Limits",
            description="Monitor position sizes against risk limits",
            framework=RegulatoryFramework.SEC,
            severity=ComplianceLevel.WARNING,
            parameters={
                "max_position_percent": 10,  # 10% of portfolio
                "max_sector_concentration": 25,  # 25% in single sector
                "max_single_stock_percent": 5  # 5% in single stock
            }
        )
        
        self.rules["risk_leverage_limit"] = ComplianceRule(
            rule_id="risk_leverage_limit",
            name="Leverage Limits",
            description="Monitor leverage ratios",
            framework=RegulatoryFramework.SEC,
            severity=ComplianceLevel.VIOLATION,
            parameters={
                "max_leverage_ratio": 4.0,  # 4:1 leverage
                "margin_call_threshold": 0.25,  # 25% maintenance margin
                "forced_liquidation_threshold": 0.15  # 15% equity
            }
        )
        
        # GDPR Rules
        self.rules["gdpr_data_retention"] = ComplianceRule(
            rule_id="gdpr_data_retention",
            name="Data Retention Limits",
            description="Ensure data is not retained beyond legal limits",
            framework=RegulatoryFramework.GDPR,
            severity=ComplianceLevel.VIOLATION,
            parameters={
                "max_retention_days": 2555,  # 7 years
                "anonymization_required": True,
                "deletion_grace_period_days": 30
            }
        )
        
        logger.info(f"✅ Loaded {len(self.rules)} compliance rules")
    
    async def check_compliance(self, entity_type: str, entity_id: str, data: Dict[str, Any]) -> List[ComplianceViolation]:
        """Check compliance for a specific entity"""
        violations = []
        
        for rule_id, rule in self.rules.items():
            if not rule.enabled:
                continue
            
            try:
                violation = await self._evaluate_rule(rule, entity_type, entity_id, data)
                if violation:
                    violations.append(violation)
                    self.violations.append(violation)
                    
                    # Log violation
                    logger.warning(f"🚨 Compliance violation: {violation.title} ({violation.rule_id})")
                    
                    # Trigger alerts for critical violations
                    if violation.severity == ComplianceLevel.CRITICAL:
                        await self._trigger_critical_alert(violation)
                    
            except Exception as e:
                logger.error(f"Error evaluating rule {rule_id}: {e}")
        
        return violations
    
    async def _evaluate_rule(self, rule: ComplianceRule, entity_type: str, entity_id: str, data: Dict[str, Any]) -> Optional[ComplianceViolation]:
        """Evaluate a specific compliance rule"""
        
        if rule.rule_id == "sec_pattern_day_trader":
            return await self._check_pattern_day_trader(rule, entity_type, entity_id, data)
        elif rule.rule_id == "sec_insider_trading":
            return await self._check_insider_trading(rule, entity_type, entity_id, data)
        elif rule.rule_id == "finra_anti_money_laundering":
            return await self._check_anti_money_laundering(rule, entity_type, entity_id, data)
        elif rule.rule_id == "risk_position_limit":
            return await self._check_position_limits(rule, entity_type, entity_id, data)
        elif rule.rule_id == "risk_leverage_limit":
            return await self._check_leverage_limits(rule, entity_type, entity_id, data)
        elif rule.rule_id == "gdpr_data_retention":
            return await self._check_data_retention(rule, entity_type, entity_id, data)
        
        return None
    
    async def _check_pattern_day_trader(self, rule: ComplianceRule, entity_type: str, entity_id: str, data: Dict[str, Any]) -> Optional[ComplianceViolation]:
        """Check for pattern day trader violations"""
        if entity_type != "user":
            return None
        
        # Get user's recent trades (mock implementation)
        day_trades_count = data.get("day_trades_last_5_days", 0)
        account_equity = data.get("account_equity", 0)
        
        threshold = rule.parameters["day_trade_threshold"]
        min_equity = rule.parameters["minimum_equity"]
        
        if day_trades_count >= threshold and account_equity < min_equity:
            return ComplianceViolation(
                violation_id=str(uuid.uuid4()),
                rule_id=rule.rule_id,
                severity=rule.severity,
                title="Pattern Day Trader Violation",
                description=f"Account has {day_trades_count} day trades but only ${account_equity:,.2f} equity (minimum ${min_equity:,.2f} required)",
                entity_type=entity_type,
                entity_id=entity_id,
                data={
                    "day_trades_count": day_trades_count,
                    "account_equity": account_equity,
                    "minimum_required": min_equity
                },
                timestamp=datetime.now()
            )
        
        return None
    
    async def _check_insider_trading(self, rule: ComplianceRule, entity_type: str, entity_id: str, data: Dict[str, Any]) -> Optional[ComplianceViolation]:
        """Check for potential insider trading patterns"""
        if entity_type != "trade":
            return None
        
        symbol = data.get("symbol")
        volume = data.get("volume", 0)
        avg_volume = data.get("avg_volume", 1)
        price_change = data.get("price_change_percent", 0)
        
        volume_ratio = volume / avg_volume if avg_volume > 0 else 0
        volume_threshold = rule.parameters["unusual_volume_threshold"]
        price_threshold = rule.parameters["price_movement_threshold"]
        
        if volume_ratio > volume_threshold and abs(price_change) > price_threshold:
            return ComplianceViolation(
                violation_id=str(uuid.uuid4()),
                rule_id=rule.rule_id,
                severity=rule.severity,
                title="Potential Insider Trading Pattern",
                description=f"Unusual trading activity in {symbol}: {volume_ratio:.1f}x volume, {price_change:.1%} price movement",
                entity_type=entity_type,
                entity_id=entity_id,
                data={
                    "symbol": symbol,
                    "volume_ratio": volume_ratio,
                    "price_change_percent": price_change,
                    "flags": ["unusual_volume", "significant_price_movement"]
                },
                timestamp=datetime.now()
            )
        
        return None
    
    async def _check_anti_money_laundering(self, rule: ComplianceRule, entity_type: str, entity_id: str, data: Dict[str, Any]) -> Optional[ComplianceViolation]:
        """Check for anti-money laundering violations"""
        if entity_type != "user":
            return None
        
        large_transactions = data.get("large_transactions_24h", 0)
        rapid_transactions = data.get("rapid_transactions_1h", 0)
        structuring_pattern = data.get("structuring_pattern_detected", False)
        
        large_threshold = rule.parameters["large_transaction_threshold"]
        rapid_threshold = rule.parameters["rapid_transaction_count"]
        
        violations = []
        
        if large_transactions > large_threshold:
            violations.append("large_transaction_volume")
        
        if rapid_transactions > rapid_threshold:
            violations.append("rapid_transaction_pattern")
        
        if structuring_pattern:
            violations.append("potential_structuring")
        
        if violations:
            return ComplianceViolation(
                violation_id=str(uuid.uuid4()),
                rule_id=rule.rule_id,
                severity=rule.severity,
                title="AML Suspicious Activity",
                description=f"Suspicious transaction patterns detected: {', '.join(violations)}",
                entity_type=entity_type,
                entity_id=entity_id,
                data={
                    "violations": violations,
                    "large_transactions": large_transactions,
                    "rapid_transactions": rapid_transactions,
                    "structuring_detected": structuring_pattern
                },
                timestamp=datetime.now()
            )
        
        return None
    
    async def _check_position_limits(self, rule: ComplianceRule, entity_type: str, entity_id: str, data: Dict[str, Any]) -> Optional[ComplianceViolation]:
        """Check position size limits"""
        if entity_type != "position":
            return None
        
        position_percent = data.get("position_percent_of_portfolio", 0)
        sector_concentration = data.get("sector_concentration_percent", 0)
        single_stock_percent = data.get("single_stock_percent", 0)
        
        max_position = rule.parameters["max_position_percent"]
        max_sector = rule.parameters["max_sector_concentration"]
        max_single = rule.parameters["max_single_stock_percent"]
        
        violations = []
        
        if position_percent > max_position:
            violations.append(f"position_size_exceeded_{position_percent:.1f}%")
        
        if sector_concentration > max_sector:
            violations.append(f"sector_concentration_exceeded_{sector_concentration:.1f}%")
        
        if single_stock_percent > max_single:
            violations.append(f"single_stock_limit_exceeded_{single_stock_percent:.1f}%")
        
        if violations:
            return ComplianceViolation(
                violation_id=str(uuid.uuid4()),
                rule_id=rule.rule_id,
                severity=rule.severity,
                title="Position Limit Violation",
                description=f"Position limits exceeded: {', '.join(violations)}",
                entity_type=entity_type,
                entity_id=entity_id,
                data={
                    "violations": violations,
                    "position_percent": position_percent,
                    "sector_concentration": sector_concentration,
                    "single_stock_percent": single_stock_percent
                },
                timestamp=datetime.now()
            )
        
        return None
    
    async def _check_leverage_limits(self, rule: ComplianceRule, entity_type: str, entity_id: str, data: Dict[str, Any]) -> Optional[ComplianceViolation]:
        """Check leverage limits"""
        if entity_type != "portfolio":
            return None
        
        leverage_ratio = data.get("leverage_ratio", 1.0)
        margin_level = data.get("margin_level", 1.0)
        equity_ratio = data.get("equity_ratio", 1.0)
        
        max_leverage = rule.parameters["max_leverage_ratio"]
        margin_call_threshold = rule.parameters["margin_call_threshold"]
        liquidation_threshold = rule.parameters["forced_liquidation_threshold"]
        
        if leverage_ratio > max_leverage:
            return ComplianceViolation(
                violation_id=str(uuid.uuid4()),
                rule_id=rule.rule_id,
                severity=ComplianceLevel.CRITICAL if leverage_ratio > max_leverage * 1.5 else rule.severity,
                title="Leverage Limit Exceeded",
                description=f"Leverage ratio {leverage_ratio:.2f}:1 exceeds maximum {max_leverage:.2f}:1",
                entity_type=entity_type,
                entity_id=entity_id,
                data={
                    "leverage_ratio": leverage_ratio,
                    "max_allowed": max_leverage,
                    "margin_level": margin_level,
                    "equity_ratio": equity_ratio,
                    "action_required": "reduce_positions" if leverage_ratio > max_leverage * 1.2 else "monitor"
                },
                timestamp=datetime.now()
            )
        
        return None
    
    async def _check_data_retention(self, rule: ComplianceRule, entity_type: str, entity_id: str, data: Dict[str, Any]) -> Optional[ComplianceViolation]:
        """Check data retention compliance"""
        if entity_type != "user_data":
            return None
        
        data_age_days = data.get("data_age_days", 0)
        max_retention = rule.parameters["max_retention_days"]
        
        if data_age_days > max_retention:
            return ComplianceViolation(
                violation_id=str(uuid.uuid4()),
                rule_id=rule.rule_id,
                severity=rule.severity,
                title="Data Retention Violation",
                description=f"Data retained for {data_age_days} days exceeds maximum {max_retention} days",
                entity_type=entity_type,
                entity_id=entity_id,
                data={
                    "data_age_days": data_age_days,
                    "max_retention_days": max_retention,
                    "action_required": "delete_or_anonymize"
                },
                timestamp=datetime.now()
            )
        
        return None
    
    async def _trigger_critical_alert(self, violation: ComplianceViolation):
        """Trigger alert for critical compliance violations"""
        logger.critical(f"🚨 CRITICAL COMPLIANCE VIOLATION: {violation.title}")
        
        # Here you would integrate with alerting systems:
        # - Send email to compliance team
        # - Create incident in incident management system
        # - Notify via Slack/Teams
        # - Trigger automated remediation if configured
    
    async def log_audit_event(self, event_type: str, user_id: str, tenant_id: str, 
                            entity_type: str, entity_id: str, action: str,
                            old_values: Dict[str, Any] = None, new_values: Dict[str, Any] = None,
                            ip_address: str = None, user_agent: str = None):
        """Log audit event"""
        
        audit_event = AuditEvent(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            user_id=user_id,
            tenant_id=tenant_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_values=old_values or {},
            new_values=new_values or {},
            timestamp=datetime.now(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self.audit_events.append(audit_event)
        
        # Trim audit events if memory limit exceeded
        if len(self.audit_events) > self.max_audit_events_memory:
            self.audit_events = self.audit_events[-self.max_audit_events_memory:]
        
        logger.info(f"📝 Audit event logged: {event_type} - {action} on {entity_type}:{entity_id}")
    
    async def _compliance_monitoring_loop(self):
        """Background compliance monitoring loop"""
        while self.ready:
            try:
                # Perform periodic compliance checks
                await self._periodic_compliance_check()
                
                # Clean up old violations
                await self._cleanup_old_violations()
                
                await asyncio.sleep(self.monitoring_interval)
                
            except Exception as e:
                logger.error(f"Compliance monitoring error: {e}")
                await asyncio.sleep(30)
    
    async def _periodic_compliance_check(self):
        """Perform periodic compliance checks"""
        # This would check various entities for compliance
        # In a real implementation, this would query the database
        logger.debug("🔍 Running periodic compliance check...")
    
    async def _cleanup_old_violations(self):
        """Clean up old resolved violations"""
        cutoff_date = datetime.now() - timedelta(days=90)
        
        initial_count = len(self.violations)
        self.violations = [
            v for v in self.violations 
            if not v.resolved or v.timestamp > cutoff_date
        ]
        
        cleaned_count = initial_count - len(self.violations)
        if cleaned_count > 0:
            logger.info(f"🧹 Cleaned up {cleaned_count} old compliance violations")
    
    async def _regulatory_reporting_loop(self):
        """Background regulatory reporting loop"""
        while self.ready:
            try:
                # Generate regulatory reports
                await self._generate_regulatory_reports()
                
                # Sleep for 24 hours
                await asyncio.sleep(86400)
                
            except Exception as e:
                logger.error(f"Regulatory reporting error: {e}")
                await asyncio.sleep(3600)  # Retry in 1 hour
    
    async def _generate_regulatory_reports(self):
        """Generate regulatory reports"""
        logger.info("📊 Generating regulatory reports...")
        
        # Generate different reports based on requirements
        reports = {
            "daily_trading_summary": await self._generate_daily_trading_report(),
            "compliance_violations": await self._generate_violations_report(),
            "audit_trail": await self._generate_audit_report(),
            "risk_metrics": await self._generate_risk_report()
        }
        
        # In production, these would be saved to files or sent to regulators
        logger.info(f"✅ Generated {len(reports)} regulatory reports")
    
    async def _generate_daily_trading_report(self) -> Dict[str, Any]:
        """Generate daily trading summary report"""
        return {
            "report_date": datetime.now().date().isoformat(),
            "total_trades": 0,  # Would query from database
            "total_volume": 0,
            "unique_traders": 0,
            "compliance_violations": len([v for v in self.violations if v.timestamp.date() == datetime.now().date()])
        }
    
    async def _generate_violations_report(self) -> Dict[str, Any]:
        """Generate compliance violations report"""
        recent_violations = [
            v for v in self.violations 
            if v.timestamp > datetime.now() - timedelta(days=30)
        ]
        
        return {
            "report_period": "last_30_days",
            "total_violations": len(recent_violations),
            "critical_violations": len([v for v in recent_violations if v.severity == ComplianceLevel.CRITICAL]),
            "unresolved_violations": len([v for v in recent_violations if not v.resolved]),
            "violations_by_rule": self._group_violations_by_rule(recent_violations)
        }
    
    async def _generate_audit_report(self) -> Dict[str, Any]:
        """Generate audit trail report"""
        recent_events = [
            e for e in self.audit_events 
            if e.timestamp > datetime.now() - timedelta(days=7)
        ]
        
        return {
            "report_period": "last_7_days",
            "total_events": len(recent_events),
            "events_by_type": self._group_events_by_type(recent_events),
            "unique_users": len(set(e.user_id for e in recent_events))
        }
    
    async def _generate_risk_report(self) -> Dict[str, Any]:
        """Generate risk metrics report"""
        return {
            "report_date": datetime.now().isoformat(),
            "active_rules": len([r for r in self.rules.values() if r.enabled]),
            "monitoring_status": "active" if self.ready else "inactive",
            "last_check": datetime.now().isoformat()
        }
    
    def _group_violations_by_rule(self, violations: List[ComplianceViolation]) -> Dict[str, int]:
        """Group violations by rule"""
        groups = {}
        for violation in violations:
            groups[violation.rule_id] = groups.get(violation.rule_id, 0) + 1
        return groups
    
    def _group_events_by_type(self, events: List[AuditEvent]) -> Dict[str, int]:
        """Group audit events by type"""
        groups = {}
        for event in events:
            groups[event.event_type] = groups.get(event.event_type, 0) + 1
        return groups
    
    async def resolve_violation(self, violation_id: str, resolution_notes: str) -> bool:
        """Resolve a compliance violation"""
        for violation in self.violations:
            if violation.violation_id == violation_id:
                violation.resolved = True
                violation.resolution_notes = resolution_notes
                
                logger.info(f"✅ Resolved compliance violation: {violation_id}")
                return True
        
        return False
    
    def get_compliance_status(self) -> Dict[str, Any]:
        """Get overall compliance status"""
        active_violations = [v for v in self.violations if not v.resolved]
        critical_violations = [v for v in active_violations if v.severity == ComplianceLevel.CRITICAL]
        
        return {
            "status": "critical" if critical_violations else "warning" if active_violations else "compliant",
            "total_violations": len(active_violations),
            "critical_violations": len(critical_violations),
            "active_rules": len([r for r in self.rules.values() if r.enabled]),
            "last_check": datetime.now().isoformat(),
            "monitoring_active": self.ready
        }
    
    def get_violations_summary(self, days: int = 30) -> Dict[str, Any]:
        """Get violations summary for specified period"""
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_violations = [v for v in self.violations if v.timestamp > cutoff_date]
        
        return {
            "period_days": days,
            "total_violations": len(recent_violations),
            "violations_by_severity": {
                level.value: len([v for v in recent_violations if v.severity == level])
                for level in ComplianceLevel
            },
            "violations_by_rule": self._group_violations_by_rule(recent_violations),
            "resolved_violations": len([v for v in recent_violations if v.resolved])
        }
    
    async def cleanup(self):
        """Cleanup compliance engine resources"""
        logger.info("🧹 Cleaning up Compliance Engine...")
        
        self.ready = False
        
        # Cancel background tasks
        if self.monitoring_task:
            self.monitoring_task.cancel()
        if self.reporting_task:
            self.reporting_task.cancel()
        
        # Clear data
        self.violations.clear()
        self.audit_events.clear()


# Global compliance engine instance
compliance_engine = ComplianceEngine()


async def get_compliance_engine() -> ComplianceEngine:
    """Get compliance engine instance"""
    if not compliance_engine.ready:
        await compliance_engine.initialize()
    return compliance_engine