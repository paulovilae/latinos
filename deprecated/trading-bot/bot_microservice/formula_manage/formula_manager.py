import pandas as pd
from .utils import sort_formulas, create_user_dictionary
from .scheduler import Scheduler
import uuid


class Formula_manager:

    def __init__(self, strategy_list: list, scheduler: Scheduler):
        self.stragegy_1m = strategy_list
        self.uuid_1m = str(uuid.uuid4())
        self.uuid_5m = str(uuid.uuid4())
        self.uuid_15m = str(uuid.uuid4())
        self.uuid_1h = str(uuid.uuid4())
        self.uuid_1d = str(uuid.uuid4())
        self.scheduler = scheduler

    def scedule_formulas(self):
        # Schedule formulas for 1 minute interval
        self.scheduler.schedule_formulas(
            df=self.stragegy_1m, period="min", time=1, uuid=self.uuid_1m
        )
        self.scheduler.scheduler.start()

        return True
