from apscheduler.schedulers.background import BackgroundScheduler
from formula_calc.calculate_formulas import run_strategies
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta


class Scheduler:
    def __init__(self, scheduler: BackgroundScheduler):
        self.scheduler = scheduler

    def schedule_formulas(self, time: int, period: str, df, uuid: str):
        if period == "min":
            interval = IntervalTrigger(minutes=time)
        elif period == "hour":
            interval = IntervalTrigger(hours=time)
        elif period == "day":
            interval = IntervalTrigger(days=time)

        start_time = datetime.now() + timedelta(seconds=5)

        print("scheduled job")
        self.scheduler.add_job(
            func=run_strategies,
            trigger=interval,
            kwargs={"strategy_list": df},
            id=uuid,
            run_date=start_time,
        )
        print(self.scheduler.get_jobs())

    # def start_scheduler(self):
    #     self.scheduler.start()

    def modify_scheduled_job(
        self,
        job_uuid: str,
    ):
        self.scheduler.modify_job(id=job_uuid)
        return True
