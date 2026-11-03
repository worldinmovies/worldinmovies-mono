import { useParams } from "react-router-dom";
import { CountryPage } from "@/components/CountryPage";

const CountryPageRoute = () => {
  const { countryCode = "" } = useParams<{ countryCode: string }>();

  return <CountryPage countryCode={countryCode} />;
};

export default CountryPageRoute;
